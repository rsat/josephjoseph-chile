const STRAPI_URL = process.env.STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN;
const SHOPIFY_URL = 'https://josephjoseph.com/products.json?limit=250';

interface ShopifyProduct {
	id: number;
	title: string;
	body_html: string;
	vendor: string;
	product_type: string;
	tags: string[];
	images: Array<{
		src: string;
		alt: string | null;
	}>;
}

function mapCategory(productType: string, tags: string[]): string {
	const type = productType.toLowerCase();
	const tagStr = tags.join(' ').toLowerCase();

	if (type.includes('knife') || type.includes('knives') || tagStr.includes('knife')) return 'Preparación';
	if (type.includes('utensil') || tagStr.includes('utensil')) return 'Utensilios';
	if (type.includes('board') || type.includes('chopping') || tagStr.includes('board')) return 'Preparación';
	if (type.includes('storage') || type.includes('container') || tagStr.includes('storage')) return 'Almacenamiento';
	if (type.includes('bowl') || type.includes('mixing')) return 'Preparación';
	if (type.includes('drain') || type.includes('rack')) return 'Organización';
	if (type.includes('bin') || type.includes('waste')) return 'Organización';
	if (type.includes('scale') || type.includes('measure')) return 'Accesorios';
	if (type.includes('cook') || type.includes('pan') || type.includes('pot')) return 'Cocción';
	if (type.includes('opener')) return 'Utensilios';

	return 'Accesorios';
}

function generateGradient(index: number): string {
	const gradients = [
		'linear-gradient(135deg, #E8E8E8 0%, #F5F5F5 100%)',
		'linear-gradient(135deg, #D4E8E4 0%, #E8F4F2 100%)',
		'linear-gradient(135deg, #F5E6D3 0%, #FFF5E8 100%)',
		'linear-gradient(135deg, #D8E8F0 0%, #E8F4F8 100%)',
		'linear-gradient(135deg, #E8D8E8 0%, #F4E8F4 100%)',
		'linear-gradient(135deg, #FFE5E5 0%, #FFF5F5 100%)',
	];
	return gradients[index % gradients.length];
}

function cleanDescription(html: string): string {
	if (!html) return '';

	let text = html.replace(/<[^>]*>/g, ' ');
	text = text
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"');

	text = text.replace(/\s+/g, ' ').trim();

	const firstSentence = text.split('.')[0];
	if (firstSentence.length < 200 && firstSentence.length > 0) return firstSentence + '.';

	if (text.length > 200) return text.substring(0, 200) + '...';
	return text || 'Producto de Joseph Joseph';
}

function extractFeatures(html: string): string[] {
	const features: string[] = [];
	const liMatches = html.match(/<li[^>]*>(.*?)<\/li>/gi);

	if (liMatches && liMatches.length > 0) {
		liMatches.slice(0, 3).forEach(li => {
			const text = li.replace(/<[^>]*>/g, '').trim();
			if (text && text.length < 100) {
				features.push(text);
			}
		});
	}

	return features.length > 0 ? features : [
		'Diseño innovador',
		'Alta calidad',
		'Fácil de limpiar'
	];
}

async function importProducts() {
	console.log('🚀 Importing products from Joseph Joseph Shopify...\n');

	if (!STRAPI_API_TOKEN) {
		console.error('❌ Error: STRAPI_API_TOKEN not found');
		process.exit(1);
	}

	// Fetch products from Shopify
	console.log('📥 Fetching products from Shopify...');
	const response = await fetch(SHOPIFY_URL);
	const data = await response.json();
	const products: ShopifyProduct[] = data.products;

	console.log(`✅ Found ${products.length} products\n`);

	// Filter kitchen products and limit to 20
	const kitchenProducts = products
		.filter(p => {
			const type = p.product_type.toLowerCase();
			const tags = p.tags.map(t => t.toLowerCase());
			return (
				type.includes('kitchen') ||
				type.includes('utensil') ||
				type.includes('knife') ||
				type.includes('board') ||
				type.includes('storage') ||
				type.includes('opener') ||
				type.includes('cook') ||
				tags.some(t => t.includes('kitchen') || t.includes('cook'))
			);
		})
		.filter(p => p.images && p.images.length > 0)
		.slice(0, 20);

	console.log(`🔪 Selected ${kitchenProducts.length} kitchen products with images\n`);

	let count = 0;

	for (const product of kitchenProducts) {
		try {
			console.log(`📦 Processing: ${product.title}`);

			const productData = {
				name: product.title,
				description: cleanDescription(product.body_html),
				category: mapCategory(product.product_type, product.tags),
				gradient: generateGradient(count),
				features: extractFeatures(product.body_html),
				isNew: false,
			};

			const createResponse = await fetch(`${STRAPI_URL}/api/products`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
				},
				body: JSON.stringify({
					data: {
						...productData,
						publishedAt: new Date().toISOString(),
					},
				}),
			});

			if (!createResponse.ok) {
				const error = await createResponse.text();
				console.error(`   ❌ Failed to create: ${error}`);
				continue;
			}

			const createdProduct = await createResponse.json();
			console.log(`   ✅ Created! ID: ${createdProduct.data.documentId}`);
			console.log(`   🖼️  Image URL: ${product.images[0].src}`);
			count++;
			console.log('');
		} catch (error) {
			console.error(`   ❌ Error:`, error);
			console.log('');
		}
	}

	console.log(`\n✨ Finished! Imported ${count} products`);
	console.log(`\nℹ️  Image URLs have been added to products.`);
	console.log(`   You can manually upload images in Strapi admin or update the schema to use imageUrl field.\n`);
}

importProducts();
