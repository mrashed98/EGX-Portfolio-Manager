"""update tradingview credentials to use session_id

Revision ID: g5h6i7j8k9l0
Revises: f8a9b0c1d2e3
Create Date: 2025-01-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'g5h6i7j8k9l0'
down_revision = 'f8a9b0c1d2e3'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add session_id column
    op.add_column('tradingview_credentials', sa.Column('session_id', sa.Text(), nullable=True))
    
    # Make username and encrypted_password nullable since we're now using session_id
    op.alter_column('tradingview_credentials', 'username',
                    existing_type=sa.String(length=255),
                    nullable=True)
    op.alter_column('tradingview_credentials', 'encrypted_password',
                    existing_type=sa.Text(),
                    nullable=True)


def downgrade() -> None:
    # Remove session_id column
    op.drop_column('tradingview_credentials', 'session_id')
    
    # Make username and encrypted_password non-nullable again
    op.alter_column('tradingview_credentials', 'username',
                    existing_type=sa.String(length=255),
                    nullable=False)
    op.alter_column('tradingview_credentials', 'encrypted_password',
                    existing_type=sa.Text(),
                    nullable=False)

