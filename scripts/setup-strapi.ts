const STRAPI_URL = 'http://localhost:1337';
const STRAPI_API_TOKEN = process.env.STRAPI_API_TOKEN || '';

const productSchema = {
	kind: 'collectionType',
	collectionName: 'products',
	info: {
		singularName: 'product',
		pluralName: 'products',
		displayName: 'Product',
		description: 'Products for Joseph Joseph store'
	},
	options: {
		draftAndPublish: true,
	},
	pluginOptions: {},
	attributes: {
		name: {
			type: 'string',
			required: true,
		},
		description: {
			type: 'text',
			required: true,
		},
		category: {
			type: 'string',
			required: true,
		},
		slug: {
			type: 'uid',
			targetField: 'name',
		},
		image: {
			type: 'media',
			multiple: false,
			required: false,
			allowedTypes: ['images'],
		},
		gradient: {
			type: 'string',
			required: true,
			default: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
		},
		features: {
			type: 'json',
			required: false,
		},
		isNew: {
			type: 'boolean',
			default: false,
		},
	},
};

const publicPermissions = {
	product: {
		controllers: {
			product: {
				find: { enabled: true },
				findOne: { enabled: true },
			},
		},
	},
};

async function setupStrapi() {
	console.log('🚀 Setting up Strapi CMS...\n');

	if (!STRAPI_API_TOKEN) {
		console.error('❌ Error: STRAPI_API_TOKEN not found');
		console.log('Please add your Strapi API token to .env file');
		process.exit(1);
	}

	try {
		// Step 1: Create content-type
		console.log('📦 Creating Product content-type...');
		const createResponse = await fetch(`${STRAPI_URL}/content-type-builder/content-types`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
			},
			body: JSON.stringify({
				contentType: productSchema,
			}),
		});

		if (!createResponse.ok) {
			const error = await createResponse.text();
			console.error(`❌ Failed to create content-type: ${createResponse.status}`);
			console.error(error);
			process.exit(1);
		}

		console.log('✅ Product content-type created successfully!');
		console.log('\n⏳ Waiting for Strapi to restart...');

		// Wait for Strapi to restart after schema change
		await new Promise(resolve => setTimeout(resolve, 5000));

		// Step 2: Configure public permissions
		console.log('\n🔓 Configuring public permissions...');

		// Get public role ID
		const rolesResponse = await fetch(`${STRAPI_URL}/api/users-permissions/roles`, {
			headers: {
				'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
			},
		});

		if (!rolesResponse.ok) {
			console.error('❌ Failed to get roles');
			process.exit(1);
		}

		const rolesData = await rolesResponse.json();
		const publicRole = rolesData.roles.find((r: any) => r.type === 'public');

		if (!publicRole) {
			console.error('❌ Public role not found');
			process.exit(1);
		}

		// Update public role permissions
		const permissionsResponse = await fetch(
			`${STRAPI_URL}/api/users-permissions/roles/${publicRole.id}`,
			{
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${STRAPI_API_TOKEN}`,
				},
				body: JSON.stringify({
					name: publicRole.name,
					description: publicRole.description,
					permissions: {
						...publicRole.permissions,
						'api::product.product': {
							controllers: {
								product: {
									find: { enabled: true },
									findOne: { enabled: true },
								},
							},
						},
					},
				}),
			}
		);

		if (!permissionsResponse.ok) {
			console.error('❌ Failed to update permissions');
			const error = await permissionsResponse.text();
			console.error(error);
		} else {
			console.log('✅ Public permissions configured successfully!');
		}

		console.log('\n✨ Strapi setup completed!');
		console.log('\nNext steps:');
		console.log('1. Run: npm run migrate (to import products)');
		console.log('2. Visit http://localhost:1337/admin to manage products');

	} catch (error) {
		console.error('❌ Setup failed:', error);
		process.exit(1);
	}
}

setupStrapi();
