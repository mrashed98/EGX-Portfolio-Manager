"""add manual holdings fields

Revision ID: e4f5a6b7c8d9
Revises: d1e2f3g4h5i6
Create Date: 2025-10-12 14:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'e4f5a6b7c8d9'
down_revision = 'd1e2f3g4h5i6'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make strategy_id nullable
    op.alter_column('holdings', 'strategy_id',
               existing_type=sa.INTEGER(),
               nullable=True)
    
    # Add new columns
    op.add_column('holdings', sa.Column('portfolio_id', sa.Integer(), nullable=True))
    op.add_column('holdings', sa.Column('purchase_date', sa.DateTime(), nullable=True))
    op.add_column('holdings', sa.Column('notes', sa.Text(), nullable=True))
    op.add_column('holdings', sa.Column('is_manual', sa.Boolean(), nullable=False, server_default='false'))
    
    # Add foreign key constraint for portfolio_id
    op.create_foreign_key('holdings_portfolio_id_fkey', 'holdings', 'portfolios', ['portfolio_id'], ['id'])
    
    # Create indexes for better query performance
    op.create_index(op.f('ix_holdings_portfolio_id'), 'holdings', ['portfolio_id'], unique=False)
    op.create_index(op.f('ix_holdings_is_manual'), 'holdings', ['is_manual'], unique=False)
    op.create_index(op.f('ix_holdings_purchase_date'), 'holdings', ['purchase_date'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_holdings_purchase_date'), table_name='holdings')
    op.drop_index(op.f('ix_holdings_is_manual'), table_name='holdings')
    op.drop_index(op.f('ix_holdings_portfolio_id'), table_name='holdings')
    
    # Drop foreign key
    op.drop_constraint('holdings_portfolio_id_fkey', 'holdings', type_='foreignkey')
    
    # Drop columns
    op.drop_column('holdings', 'is_manual')
    op.drop_column('holdings', 'notes')
    op.drop_column('holdings', 'purchase_date')
    op.drop_column('holdings', 'portfolio_id')
    
    # Make strategy_id not nullable again
    op.alter_column('holdings', 'strategy_id',
               existing_type=sa.INTEGER(),
               nullable=False)

