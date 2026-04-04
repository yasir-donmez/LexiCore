import os
from dataclasses import dataclass
from typing import Optional

import firebase_admin
from fastapi import Depends, Header, HTTPException
from firebase_admin import auth, credentials

from .config import settings


@dataclass
class CurrentUser:
    user_id: str
    email: str
    name: Optional[str] = None


_firebase_initialized = False


def _init_firebase_admin() -> None:
    global _firebase_initialized
    if _firebase_initialized:
        return
    try:
        firebase_admin.get_app()
    except ValueError:
        cred_path = settings.GOOGLE_APPLICATION_CREDENTIALS
        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            init_options = {"projectId": settings.FIRESTORE_PROJECT_ID} if settings.FIRESTORE_PROJECT_ID else {}
            firebase_admin.initialize_app(cred, init_options)
        elif settings.FIRESTORE_PROJECT_ID:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred, {"projectId": settings.FIRESTORE_PROJECT_ID})
        else:
            firebase_admin.initialize_app()
    _firebase_initialized = True


def get_current_user(authorization: str = Header(default="")) -> CurrentUser:
    if not settings.FIREBASE_AUTH_REQUIRED:
        return CurrentUser(user_id="dev-user", email="dev@local")

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header is missing or invalid")

    token = authorization.replace("Bearer ", "", 1).strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing bearer token")

    try:
        _init_firebase_admin()
        decoded = auth.verify_id_token(token)
    except Exception as exc:
        raise HTTPException(status_code=401, detail=f"Invalid Firebase token: {exc}") from exc

    user_id = decoded.get("uid")
    email = decoded.get("email", "")
    name = decoded.get("name")
    if not user_id:
        raise HTTPException(status_code=401, detail="Token does not contain uid")

    return CurrentUser(user_id=user_id, email=email, name=name)


def current_user_dependency(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    return user
