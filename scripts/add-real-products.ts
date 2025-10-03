const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

const realProducts = [
	{
		name: 'Elevate™ Ice Cream Scoop',
		description: 'Cuchara para helado con base elevada que evita el contacto con superficies',
		category: 'Utensilios',
		gradient: 'linear-gradient(135deg, #E8E8E8 0%, #F5F5F5 100%)',
		features: [
			'Base elevada para mayor higiene',
			'Mango ergonómico',
			'Apto para lavavajillas'
		],
		isNew: false,
	},
	{
		name: 'Multi-Prep™ Food Chopper',
		description: 'Picador de alimentos 3 en 1 multicolor para verduras y frutas',
		category: 'Preparación',
		gradient: 'linear-gradient(135deg, #FFE5E5 0%, #FFF5F5 100%)',
		features: [
			'3 tamaños diferentes',
			'Diseño compacto',
			'Fácil limpieza'
		],
		isNew: true,
	},
	{
		name: 'Ringo™ Pizza Cutter',
		description: 'Cortador de pizza con sistema de limpieza fácil',
		category: 'Utensilios',
		gradient: 'linear-gradient(135deg, #FFE0E0 0%, #FFF0F0 100%)',
		features: [
			'Diseño circular innovador',
			'Hoja de acero inoxidable',
			'Fácil de limpiar'
		],
		isNew: false,
	},
	{
		name: 'Helix™ Potato Ricer',
		description: 'Prensador de papas con diseño helicoidal para mayor eficiencia',
		category: 'Preparación',
		gradient: 'linear-gradient(135deg, #F0F0F0 0%, #FFFFFF 100%)',
		features: [
			'Diseño helicoidal único',
			'Fácil de usar',
			'Apto para lavavajillas'
		],
		isNew: false,
	},
	{
		name: 'Helix™ Garlic Press',
		description: 'Prensador de ajo con mecanismo giratorio innovador',
		category: 'Utensilios',
		gradient: 'linear-gradient(135deg, #E0F0E0 0%, #F0F8F0 100%)',
		features: [
			'Mecanismo giratorio',
			'Fácil limpieza',
			'Diseño compacto'
		],
		isNew: false,
	},
	{
		name: 'Twist™ 2-in-1 Whisk',
		description: 'Batidor 2 en 1 que se transforma con un giro',
		category: 'Utensilios',
		gradient: 'linear-gradient(135deg, #E0E8F0 0%, #F0F4F8 100%)',
		features: [
			'Batidor plano y globo en uno',
			'Transformación con un giro',
			'Ahorra espacio'
		],
		isNew: false,
	},
	{
		name: 'Delta Potato Masher',
		description: 'Machacador de papas con diseño ergonómico en forma de delta',
		category: 'Utensilios',
		gradient: 'linear-gradient(135deg, #E0F8E0 0%, #F0FCF0 100%)',
		features: [
			'Diseño ergonómico',
			'Cabezal de acero inoxidable',
			'Mango antideslizante'
		],
		isNew: false,
	},
	{
		name: 'Nest™ Measure',
		description: 'Set de tazas medidoras que se anidan para ahorrar espacio',
		category: 'Accesorios',
		gradient: 'linear-gradient(135deg, #E0E8FF 0%, #F0F4FF 100%)',
		features: [
			'5 tazas que se anidan',
			'Medidas métricas e imperiales',
			'Código de colores'
		],
		isNew: false,
	},
	{
		name: 'M-Cuisine™ Rice Cooker',
		description: 'Olla para cocinar arroz en microondas con sistema de vapor',
		category: 'Cocción',
		gradient: 'linear-gradient(135deg, #F0F0F0 0%, #FFFFFF 100%)',
		features: [
			'Para microondas',
			'Sistema de cocción al vapor',
			'Libre de BPA'
		],
		isNew: false,
	},
	{
		name: 'CleanForce™ Garlic Press',
		description: 'Prensador de ajo con sistema de auto-limpieza',
		category: 'Utensilios',
		gradient: 'linear-gradient(135deg, #E8F0E8 0%, #F4F8F4 100%)',
		features: [
			'Sistema de auto-limpieza',
			'Prensa con un solo movimiento',
			'Acero inoxidable'
		],
		isNew: true,
	},
];

async function addProducts() {
	console.log('🚀 Adding real Joseph Joseph products to Strapi...\n');

	if (!STRAPI_API_TOKEN) {
		console.error('❌ Error: STRAPI_API_TOKEN not found');
		process.exit(1);
	}

	for (const product of realProducts) {
		try {
			console.log(`📦 Adding: ${product.name}...`);

			const response = await fetch(`${STRAPI_URL}/api/products`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
				},
				body: JSON.stringify({
					data: {
						...product,
						publishedAt: new Date().toISOString(),
					},
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				console.error(`   ❌ Failed: ${response.status} - ${error}`);
			} else {
				const data = await response.json();
				console.log(`   ✅ Success! ID: ${data.data.documentId}`);
			}
		} catch (error) {
			console.error(`   ❌ Error adding ${product.name}:`, error);
		}
	}

	console.log('\n✨ Done! Added ${realProducts.length} products');
}

addProducts();
