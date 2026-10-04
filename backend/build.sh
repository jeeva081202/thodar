#!/usr/bin/env bash
# Render build script
set -o errexit
pip install -r requirements.txt
python manage.py collectstatic --no-input
python manage.py migrate

# 👑 Admin account: Render la ADMIN_USERNAME + ADMIN_PASSWORD env set pannina automatic ah create aagum.
# (Free plan la Shell illa, adhanaala idhu.) Admin create aanadhum andha 2 env um delete pannidalaam.
if [ -n "$ADMIN_USERNAME" ] && [ -n "$ADMIN_PASSWORD" ]; then
  python manage.py makeadmin --username "$ADMIN_USERNAME" --password "$ADMIN_PASSWORD"
fi
