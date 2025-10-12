"""add tradingview credentials

Revision ID: f8a9b0c1d2e3
Revises: 7c8d9e0f1a2b
Create Date: 2025-01-12 20:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'f8a9b0c1d2e3'
down_revision = 'e4f5a6b7c8d9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create tradingview_credentials table
    op.create_table(
        'tradingview_credentials',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('username', sa.String(length=255), nullable=False),
        sa.Column('encrypted_password', sa.Text(), nullable=False),
        sa.Column('is_connected', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('last_check_at', sa.DateTime(), nullable=True),
        sa.Column('connection_error', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.Column('updated_at', sa.DateTime(), nullable=False, server_default=sa.text('CURRENT_TIMESTAMP')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id')
    )
    
    # Create indexes
    op.create_index(op.f('ix_tradingview_credentials_id'), 'tradingview_credentials', ['id'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_tradingview_credentials_id'), table_name='tradingview_credentials')
    
    # Drop table
    op.drop_table('tradingview_credentials')

