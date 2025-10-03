const STRAPI_URL = import.meta.env.PUBLIC_STRAPI_URL || 'http://localhost:1337';
const STRAPI_API_TOKEN = import.meta.env.STRAPI_API_TOKEN;

interface StrapiResponse<T> {
	data: T;
	meta: {
		pagination?: {
			page: number;
			pageSize: number;
			pageCount: number;
			total: number;
		};
	};
}

interface StrapiProduct {
	id: number;
	documentId: string;
	name: string;
	description: string;
	category: string;
	slug?: string;
	image?: {
		data?: {
			attributes: {
				url: string;
				alternativeText?: string;
			};
		};
	};
	imageUrl?: string;
	gallery?: {
		data?: Array<{
			attributes: {
				url: string;
				alternativeText?: string;
			};
		}>;
	};
	galleryUrls?: string[];
	gradient: string;
	features?: string[];
	isNew?: boolean;
	createdAt: string;
	updatedAt: string;
	publishedAt: string;
}

export interface Product {
	id: string;
	name: string;
	description: string;
	category: string;
	image?: string;
	gallery?: string[];
	gradient: string;
	features?: string[];
	isNew?: boolean;
}

async function fetchAPI(path: string) {
	const headers: HeadersInit = {
		'Content-Type': 'application/json',
	};

	if (STRAPI_API_TOKEN) {
		headers['Authorization'] = `Bearer ${STRAPI_API_TOKEN}`;
	}

	try {
		const response = await fetch(`${STRAPI_URL}/api${path}`, {
			headers,
		});

		if (!response.ok) {
			throw new Error(`Strapi API error: ${response.status}`);
		}

		return await response.json();
	} catch (error) {
		console.error('Error fetching from Strapi:', error);
		throw error;
	}
}

function transformProduct(strapiProduct: StrapiProduct): Product {
	// Use uploaded image if available, otherwise use external imageUrl
	let imageUrl: string | undefined = undefined;
	if (strapiProduct.image?.data?.attributes?.url) {
		imageUrl = `${STRAPI_URL}${strapiProduct.image.data.attributes.url}`;
	} else if (strapiProduct.imageUrl) {
		imageUrl = strapiProduct.imageUrl;
	}

	// Process gallery images
	let gallery: string[] = [];
	if (strapiProduct.gallery?.data && strapiProduct.gallery.data.length > 0) {
		gallery = strapiProduct.gallery.data.map(img => `${STRAPI_URL}${img.attributes.url}`);
	} else if (strapiProduct.galleryUrls && strapiProduct.galleryUrls.length > 0) {
		gallery = strapiProduct.galleryUrls;
	}

	return {
		id: strapiProduct.documentId || strapiProduct.id.toString(),
		name: strapiProduct.name,
		description: strapiProduct.description,
		category: strapiProduct.category,
		image: imageUrl,
		gallery: gallery.length > 0 ? gallery : undefined,
		gradient: strapiProduct.gradient,
		features: strapiProduct.features || [],
		isNew: strapiProduct.isNew || false,
	};
}

export async function getProducts(): Promise<Product[]> {
	try {
		const response: StrapiResponse<StrapiProduct[]> = await fetchAPI(
			'/products?populate=*&pagination[pageSize]=100'
		);

		return response.data.map(transformProduct);
	} catch (error) {
		console.error('Failed to fetch products from Strapi, using fallback data:', error);
		// Fallback to static data when Strapi is not available
		const { products: fallbackProducts } = await import('../data/products');
		return fallbackProducts;
	}
}

export async function getProductById(id: string): Promise<Product | null> {
	try {
		const response: StrapiResponse<StrapiProduct[]> = await fetchAPI(
			`/products?filters[documentId][$eq]=${id}&populate=*`
		);

		if (response.data.length === 0) {
			return null;
		}

		return transformProduct(response.data[0]);
	} catch (error) {
		console.error(`Failed to fetch product ${id} from Strapi, using fallback:`, error);
		const { products: fallbackProducts } = await import('../data/products');
		return fallbackProducts.find(p => p.id === id) || null;
	}
}

export async function getProductsByCategory(category: string): Promise<Product[]> {
	try {
		const response: StrapiResponse<StrapiProduct[]> = await fetchAPI(
			`/products?filters[category][$eq]=${encodeURIComponent(category)}&populate=*&pagination[pageSize]=100`
		);

		return response.data.map(transformProduct);
	} catch (error) {
		console.error(`Failed to fetch products for category ${category}, using fallback:`, error);
		const { products: fallbackProducts } = await import('../data/products');
		return fallbackProducts.filter(p => p.category === category);
	}
}

export async function getNewProducts(): Promise<Product[]> {
	try {
		const response: StrapiResponse<StrapiProduct[]> = await fetchAPI(
			'/products?filters[isNew][$eq]=true&populate=*&pagination[pageSize]=100'
		);

		return response.data.map(transformProduct);
	} catch (error) {
		console.error('Failed to fetch new products from Strapi, using fallback:', error);
		const { products: fallbackProducts } = await import('../data/products');
		return fallbackProducts.filter(p => p.isNew);
	}
}

export async function getCategories(): Promise<string[]> {
	try {
		const products = await getProducts();
		const categories = [...new Set(products.map(p => p.category))];
		return categories.sort();
	} catch (error) {
		console.error('Failed to get categories, using fallback:', error);
		const { products: fallbackProducts } = await import('../data/products');
		const categories = [...new Set(fallbackProducts.map(p => p.category))];
		return categories.sort();
	}
}
