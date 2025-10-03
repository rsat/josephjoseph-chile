import productImages from './product-images.json';

const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function updateImageUrls() {
	console.log('🚀 Updating product image URLs in Strapi...\n');

	if (!STRAPI_API_TOKEN) {
		console.error('❌ Error: STRAPI_API_TOKEN not found');
		process.exit(1);
	}

	let successCount = 0;
	let failCount = 0;

	for (const product of productImages) {
		try {
			console.log(`📦 Updating: ${product.name}`);

			const response = await fetch(`${STRAPI_URL}/api/products/${product.id}`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
				},
				body: JSON.stringify({
					data: {
						imageUrl: product.imageUrl,
					},
				}),
			});

			if (!response.ok) {
				const error = await response.text();
				console.error(`   ❌ Failed: ${error}`);
				failCount++;
			} else {
				console.log(`   ✅ Updated!`);
				successCount++;
			}
		} catch (error) {
			console.error(`   ❌ Error:`, error);
			failCount++;
		}
	}

	console.log(`\n✨ Finished!`);
	console.log(`   ✅ Success: ${successCount}`);
	console.log(`   ❌ Failed: ${failCount}`);
}

updateImageUrls();
