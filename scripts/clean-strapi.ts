const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;

async function cleanAllProducts() {
	console.log('🧹 Cleaning all products from Strapi...\n');

	if (!STRAPI_API_TOKEN) {
		console.error('❌ Error: STRAPI_API_TOKEN not found');
		process.exit(1);
	}

	let page = 1;
	let totalDeleted = 0;

	while (true) {
		try {
			// Fetch products
			const response = await fetch(
				`${STRAPI_URL}/api/products?pagination[page]=${page}&pagination[pageSize]=100`,
				{
					headers: {
						'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
					},
				}
			);

			if (!response.ok) {
				console.error('❌ Failed to fetch products');
				break;
			}

			const data = await response.json();

			if (!data.data || data.data.length === 0) {
				break;
			}

			console.log(`📦 Page ${page}: Found ${data.data.length} products to delete`);

			// Delete each product
			for (const product of data.data) {
				try {
					const deleteResponse = await fetch(
						`${STRAPI_URL}/api/products/${product.documentId}`,
						{
							method: 'DELETE',
							headers: {
								'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
							},
						}
					);

					if (deleteResponse.ok) {
						totalDeleted++;
						process.stdout.write(`\r   Deleted: ${totalDeleted}`);
					}
				} catch (error) {
					console.error(`\n   ❌ Error deleting ${product.documentId}`);
				}
			}

			console.log(''); // New line after progress
			page++;
		} catch (error) {
			console.error('❌ Error:', error);
			break;
		}
	}

	console.log(`\n✨ Finished! Deleted ${totalDeleted} products\n`);
}

cleanAllProducts();
