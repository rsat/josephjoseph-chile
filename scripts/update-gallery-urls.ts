const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const SHOPIFY_BASE_URL = 'https://josephjoseph.com/products.json';

interface ShopifyImage {
	id: number;
	src: string;
	position: number;
}

interface ShopifyProduct {
	id: number;
	title: string;
	images: ShopifyImage[];
}

async function getAllShopifyProducts(): Promise<ShopifyProduct[]> {
	const allProducts: ShopifyProduct[] = [];
	let page = 1;
	let hasMore = true;

	console.log('📥 Fetching products from Shopify...');

	while (hasMore) {
		const url = `${SHOPIFY_BASE_URL}?limit=250&page=${page}`;
		const response = await fetch(url);
		const data = await response.json();

		if (data.products && data.products.length > 0) {
			allProducts.push(...data.products);
			page++;
		} else {
			hasMore = false;
		}
	}

	console.log(`✅ Got ${allProducts.length} products from Shopify\n`);
	return allProducts;
}

async function getAllStrapiProducts() {
	console.log('📥 Fetching products from Strapi...');
	const allProducts = [];
	let page = 1;
	let hasMore = true;

	while (hasMore) {
		const response = await fetch(
			`${STRAPI_URL}/api/products?pagination[page]=${page}&pagination[pageSize]=100`,
			{
				headers: {
					'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
				},
			}
		);

		if (!response.ok) {
			console.error('❌ Failed to fetch Strapi products');
			break;
		}

		const data = await response.json();

		if (data.data && data.data.length > 0) {
			allProducts.push(...data.data);
			page++;
		} else {
			hasMore = false;
		}
	}

	console.log(`✅ Got ${allProducts.length} products from Strapi\n`);
	return allProducts;
}

function normalizeTitle(title: string): string {
	return title
		.toLowerCase()
		.replace(/™/g, '')
		.replace(/®/g, '')
		.replace(/[^a-z0-9]/g, '')
		.trim();
}

async function updateGalleryUrls() {
	console.log('🔄 Updating gallery URLs for all products...\n');

	if (!STRAPI_API_TOKEN) {
		console.error('❌ Error: STRAPI_API_TOKEN not found');
		process.exit(1);
	}

	// Get all products from both sources
	const shopifyProducts = await getAllShopifyProducts();
	const strapiProducts = await getAllStrapiProducts();

	console.log('🔗 Matching products and updating gallery URLs...\n');

	let updated = 0;
	let failed = 0;

	for (const strapiProduct of strapiProducts) {
		try {
			const normalizedStrapiTitle = normalizeTitle(strapiProduct.name);

			// Find matching Shopify product
			const shopifyMatch = shopifyProducts.find(sp => {
				const normalizedShopifyTitle = normalizeTitle(sp.title);
				return normalizedShopifyTitle === normalizedStrapiTitle ||
					   normalizedShopifyTitle.includes(normalizedStrapiTitle) ||
					   normalizedStrapiTitle.includes(normalizedShopifyTitle);
			});

			if (!shopifyMatch || !shopifyMatch.images || shopifyMatch.images.length <= 1) {
				continue;
			}

			// Get gallery URLs (skip first image, take next 5)
			const galleryUrls = shopifyMatch.images.slice(1, 6).map(img => img.src);

			// Update product
			const updateResponse = await fetch(
				`${STRAPI_URL}/api/products/${strapiProduct.documentId}`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
					},
					body: JSON.stringify({
						data: {
							galleryUrls: galleryUrls,
						},
					}),
				}
			);

			if (updateResponse.ok) {
				updated++;
				console.log(`✅ [${updated}/${strapiProducts.length}] ${strapiProduct.name} - Added ${galleryUrls.length} gallery images`);
			} else {
				failed++;
				const error = await updateResponse.text();
				console.error(`❌ Failed to update ${strapiProduct.name}: ${error.substring(0, 100)}`);
			}
		} catch (error) {
			failed++;
			console.error(`❌ Error updating ${strapiProduct.name}:`, error);
		}
	}

	console.log(`\n✨ Finished!`);
	console.log(`   ✅ Updated: ${updated}`);
	console.log(`   ❌ Failed: ${failed}`);
	console.log(`   ⏭️  Skipped (no gallery): ${strapiProducts.length - updated - failed}\n`);
}

updateGalleryUrls();
