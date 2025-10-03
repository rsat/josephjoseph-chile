import * as fs from 'fs';
import * as path from 'path';

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
	body_html: string;
	product_type: string;
	tags: string[];
	images: ShopifyImage[];
}

// Mapeo de categorías EN -> ES
const categoryMap: Record<string, string> = {
	'woks': 'Cocción',
	'frying pans': 'Cocción',
	'saucepans': 'Cocción',
	'cookware': 'Cocción',
	'chopping boards': 'Preparación',
	'knives': 'Preparación',
	'knife sets': 'Preparación',
	'kitchen knives': 'Preparación',
	'utensils': 'Utensilios',
	'kitchen tools': 'Utensilios',
	'gadgets': 'Utensilios',
	'can openers': 'Utensilios',
	'storage': 'Almacenamiento',
	'food storage': 'Almacenamiento',
	'containers': 'Almacenamiento',
	'bins': 'Almacenamiento',
	'organisers': 'Organización',
	'organizers': 'Organización',
	'dish racks': 'Organización',
	'drainers': 'Organización',
	'scales': 'Accesorios',
	'measuring': 'Accesorios',
};

// Traducciones comunes
const translations: Record<string, string> = {
	// Product types
	'Wok': 'Wok',
	'Frying Pan': 'Sartén',
	'Saucepan': 'Cacerola',
	'Chopping Board': 'Tabla de Cortar',
	'Knife': 'Cuchillo',
	'Can Opener': 'Abrelatas',
	'Storage': 'Almacenamiento',
	'Organiser': 'Organizador',
	'Organizer': 'Organizador',

	// Common words
	'Set': 'Set',
	'Non-stick': 'Antiadherente',
	'Stainless Steel': 'Acero Inoxidable',
	'Folding': 'Plegable',
	'Handle': 'Mango',
	'Lid': 'Tapa',
	'Piece': 'Piezas',
	'Bamboo': 'Bambú',
	'Clear': 'Transparente',
	'Drawer': 'Cajón',
	'Shelf': 'Estante',
	'Easy': 'Fácil',
	'Kitchen': 'Cocina',
	'Space': 'Space',
	'Microwave': 'Microondas',
	'Bowl': 'Bowl',
	'Roll': 'Rollo',
	'Holder': 'Soporte',
	'Cutlery': 'Cubiertos',
	'On-the-go': 'Para llevar',
};

function translateTitle(title: string): string {
	let translated = title;

	// Traducir palabras comunes
	Object.entries(translations).forEach(([en, es]) => {
		const regex = new RegExp(en, 'gi');
		translated = translated.replace(regex, es);
	});

	return translated;
}

function mapCategory(productType: string, tags: string[]): string {
	const type = productType.toLowerCase();
	const tagStr = tags.join(' ').toLowerCase();

	// Buscar en el mapa de categorías
	for (const [key, category] of Object.entries(categoryMap)) {
		if (type.includes(key) || tagStr.includes(key)) {
			return category;
		}
	}

	return 'Accesorios';
}

function cleanHtml(html: string): string {
	if (!html) return '';

	let text = html
		.replace(/<[^>]*>/g, ' ')
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/\s+/g, ' ')
		.trim();

	const sentences = text.split('.');
	if (sentences[0] && sentences[0].length < 200) {
		return sentences[0] + '.';
	}

	return text.length > 200 ? text.substring(0, 200) + '...' : text;
}

function extractFeatures(html: string): string[] {
	const features: string[] = [];
	const liMatches = html.match(/<li[^>]*>(.*?)<\/li>/gi);

	if (liMatches && liMatches.length > 0) {
		liMatches.slice(0, 4).forEach(li => {
			let text = li.replace(/<[^>]*>/g, '').trim();
			// Traducir características básicas
			text = text.replace(/Folding/gi, 'Plegable');
			text = text.replace(/Non-stick/gi, 'Antiadherente');
			text = text.replace(/Dishwasher safe/gi, 'Apto para lavavajillas');
			text = text.replace(/Suitable for all hobs/gi, 'Apto para todas las placas');
			text = text.replace(/including induction/gi, 'incluida inducción');

			if (text && text.length < 150) {
				features.push(text);
			}
		});
	}

	return features.length > 0 ? features : [
		'Diseño innovador de Joseph Joseph',
		'Alta calidad y durabilidad',
		'Fácil de limpiar'
	];
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

async function getAllProducts(): Promise<ShopifyProduct[]> {
	const allProducts: ShopifyProduct[] = [];
	let page = 1;
	let hasMore = true;

	while (hasMore) {
		const url = `${SHOPIFY_BASE_URL}?limit=250&page=${page}`;
		console.log(`📥 Fetching page ${page}...`);

		const response = await fetch(url);
		const data = await response.json();

		if (data.products && data.products.length > 0) {
			allProducts.push(...data.products);
			console.log(`   ✅ Got ${data.products.length} products`);
			page++;
		} else {
			hasMore = false;
		}
	}

	return allProducts;
}

async function importAllProducts() {
	console.log('🚀 Importing ALL products from Joseph Joseph Shopify...\n');

	if (!STRAPI_API_TOKEN) {
		console.error('❌ Error: STRAPI_API_TOKEN not found');
		process.exit(1);
	}

	// Get all products
	const allProducts = await getAllProducts();
	console.log(`\n✅ Total products found: ${allProducts.length}\n`);

	// Filter kitchen-related products with images
	const kitchenProducts = allProducts.filter(p => {
		const type = p.product_type.toLowerCase();
		const tags = p.tags.map(t => t.toLowerCase());
		const hasImages = p.images && p.images.length > 0;

		return hasImages && (
			type.includes('kitchen') ||
			type.includes('cook') ||
			type.includes('knife') ||
			type.includes('board') ||
			type.includes('utensil') ||
			type.includes('storage') ||
			type.includes('wok') ||
			type.includes('pan') ||
			type.includes('organis') ||
			tags.some(t => t.includes('kitchen') || t.includes('cook'))
		);
	});

	console.log(`🔪 Selected ${kitchenProducts.length} kitchen products\n`);

	let count = 0;

	for (const product of kitchenProducts) {
		try {
			console.log(`📦 [${count + 1}/${kitchenProducts.length}] ${product.title}`);

			const productData = {
				name: translateTitle(product.title),
				description: cleanHtml(product.body_html),
				category: mapCategory(product.product_type, product.tags),
				gradient: generateGradient(count),
				features: extractFeatures(product.body_html),
				isNew: product.tags.some(t => t.toLowerCase().includes('new in')),
				imageUrl: product.images[0]?.src,
				// Guardar URLs de galería como JSON string temporal
				galleryUrls: product.images.slice(1, 6).map(img => img.src),
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
				console.error(`   ❌ Failed: ${error.substring(0, 100)}`);
				continue;
			}

			const created = await createResponse.json();
			console.log(`   ✅ Created: ${created.data.documentId}`);
			console.log(`   📁 Category: ${productData.category}`);
			console.log(`   🖼️  Images: ${product.images.length} (1 main + ${product.images.length - 1} gallery)`);
			count++;
			console.log('');
		} catch (error) {
			console.error(`   ❌ Error:`, error);
			console.log('');
		}
	}

	console.log(`\n✨ Finished! Imported ${count} products`);
	console.log(`\nℹ️  Gallery images saved as URLs. You can upload them later or update the frontend to use URLs.\n`);
}

importAllProducts();
