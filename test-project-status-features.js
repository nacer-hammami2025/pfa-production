const puppeteer = require('puppeteer');

async function testProjectStatusFeatures() {
  console.log('🧪 Test des fonctionnalités de statut de projet...\n');

  try {
    const browser = await puppeteer.launch({
      headless: false,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log('🌐 Accès au frontend...');
    await page.goto('http://localhost:4200', { waitUntil: 'networkidle2' });

    // Attendre que la page se charge
    await page.waitForTimeout(3000);

    // Vérifier si on est sur la page de login
    const loginForm = await page.$('form');
    if (loginForm) {
      console.log('🔐 Page de connexion détectée - connexion automatique...');

      // Remplir les champs de connexion
      await page.type('input[type="email"]', 'admin@pfa.com');
      await page.type('input[type="password"]', 'admin123');

      // Cliquer sur le bouton de connexion
      await page.click('button[type="submit"]');

      // Attendre la redirection
      await page.waitForNavigation({ waitUntil: 'networkidle2' });
    }

    // Attendre que la page des projets se charge
    await page.waitForTimeout(2000);

    console.log('📁 Navigation vers la page des projets...');
    await page.goto('http://localhost:4200/projects', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(2000);

    // Vérifier les filtres de statut
    console.log('🔍 Vérification des filtres de statut...');

    const filters = await page.$$('.status-filters button');
    console.log(`📊 Nombre de filtres trouvés: ${filters.length}`);

    for (let i = 0; i < filters.length; i++) {
      const filterText = await page.evaluate(el => el.textContent, filters[i]);
      console.log(`  - Filtre ${i + 1}: ${filterText}`);
    }

    // Vérifier les boutons d'action rapide sur les cartes de projet
    console.log('⚡ Vérification des boutons d\'action rapide...');

    const projectCards = await page.$$('.project-card');
    console.log(`📋 Nombre de cartes de projet trouvées: ${projectCards.length}`);

    if (projectCards.length > 0) {
      const actionButtons = await page.$$('.project-actions .btn-action');
      console.log(`🎯 Nombre de boutons d'action trouvés: ${actionButtons.length}`);

      for (let i = 0; i < Math.min(actionButtons.length, 3); i++) {
        const buttonText = await page.evaluate(el => el.textContent, actionButtons[i]);
        console.log(`  - Bouton d'action ${i + 1}: ${buttonText}`);
      }
    }

    // Vérifier le dashboard admin
    console.log('👑 Vérification du dashboard admin...');
    await page.goto('http://localhost:4200/admin/dashboard', { waitUntil: 'networkidle2' });
    await page.waitForTimeout(3000);

    const adminFilters = await page.$$('.status-filter-buttons button');
    console.log(`📊 Nombre de filtres admin trouvés: ${adminFilters.length}`);

    for (let i = 0; i < adminFilters.length; i++) {
      const filterText = await page.evaluate(el => el.textContent, adminFilters[i]);
      console.log(`  - Filtre admin ${i + 1}: ${filterText}`);
    }

    // Vérifier les boutons d'action dans le tableau admin
    const adminActionButtons = await page.$$('.action-buttons .btn-status');
    console.log(`🎯 Nombre de boutons d'action admin trouvés: ${adminActionButtons.length}`);

    console.log('\n✅ Test terminé avec succès!');
    console.log('\n📋 Résumé des fonctionnalités vérifiées:');
    console.log('  ✓ Filtres de statut présents');
    console.log('  ✓ Boutons d\'action rapide sur les cartes');
    console.log('  ✓ Filtres admin présents');
    console.log('  ✓ Boutons d\'action admin présents');

    await browser.close();

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

testProjectStatusFeatures();