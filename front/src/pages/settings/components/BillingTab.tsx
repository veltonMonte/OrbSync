import { FiCreditCard } from 'react-icons/fi';

export function BillingTab() {
  return (
    <section className="stg-section">
      <header className="stg-header">
        <h2>Assinatura e Cobrança</h2>
        <p>Detalhes do seu plano atual, histórico de pagamentos e método de cobrança.</p>
      </header>
      <div className="stg-billing-banner">
        <div className="stg-billing-plan">
          <span className="stg-plan-badge">Pro</span>
          <h3>R$ 49,00<span>/mês</span></h3>
          <p>Próxima cobrança em 15 de setembro de 2026.</p>
        </div>
        <button className="stg-btn stg-btn--secondary">Alterar Plano</button>
      </div>
      <h3 className="stg-section-title" style={{ marginTop: 32 }}>Método de Pagamento</h3>
      <div className="stg-card stg-card--row">
        <div className="stg-payment-info">
          <FiCreditCard className="stg-payment-icon" />
          <div>
            <span>Mastercard terminando em 4242</span>
            <span className="stg-text-muted">Expira em 12/28</span>
          </div>
        </div>
        <button className="stg-btn stg-btn--ghost stg-btn--sm">Atualizar</button>
      </div>
    </section>
  );
}
