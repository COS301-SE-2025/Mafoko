# In auth-service/app/db/base.py

from mavito_common.db.base_class import Base  # noqa
from mavito_common.models.user import User  # noqa
from mavito_common.models.language import Language  # noqa

# If you create more models in the common library that this service needs
# to manage, import them here as well.
