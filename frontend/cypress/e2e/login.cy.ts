describe('OliveConnect authentication', () => {
  it('logs in with a demo farmer account', () => {
    cy.visit('/login');
    cy.get('input[type="email"]').clear().type('farmer@oliveconnect.tn');
    cy.get('input[type="password"]').clear().type('Farmer@123');
    cy.contains('button', 'Se connecter').click();
    cy.location('pathname').should('eq', '/dashboard');
    cy.contains('Tableau de bord').should('be.visible');
  });
});
