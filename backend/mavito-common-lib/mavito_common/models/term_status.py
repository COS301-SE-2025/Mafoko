# mavito-common-lib/mavito_common/models/term_status.py
import enum


class TermStatus(str, enum.Enum):
    """
    Enum representing the various verification statuses of a term.
    """

    PENDING_VERIFICATION = "pending_verification"
    CROWD_VERIFIED = "crowd_verified"
    LINGUIST_VERIFIED = "linguist_verified"
    ADMIN_APPROVED = "admin_approved"
    REJECTED = "rejected"
    DRAFT = "draft"
