import * as fs from 'fs';
import * as path from 'path';

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

// Map Shopify product types to our categories
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

	// Remove HTML tags
	let text = html.replace(/<[^>]*>/g, ' ');

	// Decode HTML entities
	text = text
		.replace(/&nbsp;/g, ' ')
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"');

	// Clean up whitespace
	text = text.replace(/\s+/g, ' ').trim();

	// Limit to first sentence or 200 chars
	const firstSentence = text.split('.')[0];
	if (firstSentence.length < 200) return firstSentence + '.';

	return text.substring(0, 200) + '...';
}

async function downloadImage(url: string, filepath: string): Promise<void> {
	const response = await fetch(url);
	const buffer = await response.arrayBuffer();
	fs.writeFileSync(filepath, Buffer.from(buffer));
}

async function uploadImageToStrapi(imagePath: string): Promise<any> {
	const FormData = (await import('form-data')).default;
	const formData = new FormData();

	formData.append('files', fs.createReadStream(imagePath));

	const response = await fetch(`${STRAPI_URL}/api/upload`, {
		method: 'POST',
		headers: {
			'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
		},
		body: formData as any,
	});

	if (!response.ok) {
		throw new Error(`Failed to upload image: ${response.statusText}`);
	}

	return await response.json();
}

async function updateProductImage(productId: string, imageId: number): Promise<void> {
	const response = await fetch(`${STRAPI_URL}/api/products/${productId}`, {
		method: 'PUT',
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
		},
		body: JSON.stringify({
			data: {
				image: imageId,
			},
		}),
	});

	if (!response.ok) {
		throw new Error(`Failed to update product: ${response.statusText}`);
	}
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

	// Filter kitchen products and limit to 15
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
				tags.some(t => t.includes('kitchen') || t.includes('cook'))
			);
		})
		.slice(0, 15);

	console.log(`🔪 Selected ${kitchenProducts.length} kitchen products\n`);

	// Create temp directory for images
	const tempDir = path.join(process.cwd(), 'temp-images');
	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir);
	}

	let count = 0;

	for (const product of kitchenProducts) {
		try {
			console.log(`📦 Processing: ${product.title}`);

			// Create product in Strapi
			const productData = {
				name: product.title,
				description: cleanDescription(product.body_html),
				category: mapCategory(product.product_type, product.tags),
				gradient: generateGradient(count),
				features: [],
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
				console.error(`   ❌ Failed to create product: ${createResponse.statusText}`);
				continue;
			}

			const createdProduct = await createResponse.json();
			const productId = createdProduct.data.documentId;
			console.log(`   ✅ Created product ID: ${productId}`);

			// Download and upload image
			if (product.images && product.images.length > 0) {
				const imageUrl = product.images[0].src;
				const imageName = `${productId}.jpg`;
				const imagePath = path.join(tempDir, imageName);

				console.log(`   📥 Downloading image...`);
				await downloadImage(imageUrl, imagePath);

				console.log(`   📤 Uploading to Strapi...`);
				const uploadedImages = await uploadImageToStrapi(imagePath);

				if (uploadedImages && uploadedImages.length > 0) {
					console.log(`   🔗 Linking image to product...`);
					await updateProductImage(productId, uploadedImages[0].id);
					console.log(`   ✅ Image uploaded and linked!`);
				}

				// Clean up temp file
				fs.unlinkSync(imagePath);
			}

			count++;
			console.log('');
		} catch (error) {
			console.error(`   ❌ Error processing ${product.title}:`, error);
			console.log('');
		}
	}

	// Clean up temp directory
	if (fs.existsSync(tempDir)) {
		fs.rmdirSync(tempDir);
	}

	console.log(`\n✨ Finished! Imported ${count} products with images`);
}

importProducts();
