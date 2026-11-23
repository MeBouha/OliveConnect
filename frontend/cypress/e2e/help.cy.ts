describe('OliveConnect public help', () => {
  it('shows the role guide without authentication', () => {
    cy.visit('/help');
    cy.contains('Aide').should('be.visible');
    cy.contains('Démarrage rapide').should('be.visible');
    cy.contains('Responsable pressoir').should('be.visible');
  });
});
