import { products } from '../src/data/products';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || 'ce33600cb06669d88e53b62ac44da96445b2a1f2df84473bb4e3a1ee1c38b00193b0b06ef10cded206de55d95be2039464f2256b6ba94a41f3a7fa6dbd5e8233adad417cfdba737e8f37ef02b0537d69fc0f87f815dd88240ce508d156ba846ff328932c6d90ef3783cd00a96e6c43dce437d41fe5fc8d76c92429bf9bf6cc98';

async function migrateProducts() {
	console.log('🚀 Starting product migration to Strapi...\n');

	if (!STRAPI_API_TOKEN) {
		console.error('❌ Error: STRAPI_API_TOKEN not found in environment variables');
		console.log('Please add your Strapi API token to .env file');
		process.exit(1);
	}

	for (const product of products) {
		try {
			console.log(`📦 Migrating: ${product.name}...`);

			const response = await fetch(`${STRAPI_URL}/api/products`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
				},
				body: JSON.stringify({
					data: {
						name: product.name,
						description: product.description,
						category: product.category,
						gradient: product.gradient,
						features: product.features || [],
						isNew: product.isNew || false,
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
			console.error(`   ❌ Error migrating ${product.name}:`, error);
		}
	}

	console.log('\n✨ Migration completed!');
	console.log(`Total products processed: ${products.length}`);
}

migrateProducts();
