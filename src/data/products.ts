export interface Product {
	id: string;
	name: string;
	description: string;
	category: string;
	image?: string;
	gradient: string;
	features?: string[];
	isNew?: boolean;
}

export const products: Product[] = [
	{
		id: 'index',
		name: 'Index™',
		description: 'Set de tablas de cortar con código de colores',
		category: 'Preparación',
		gradient: 'linear-gradient(135deg, #E8E8E8 0%, #F5F5F5 100%)',
		features: ['Código de colores para evitar contaminación cruzada', 'Diseño compacto que ahorra espacio', 'Aptas para lavavajillas'],
	},
	{
		id: 'nest',
		name: 'Nest™',
		description: 'Bowls y coladores que se apilan para ahorrar espacio',
		category: 'Preparación',
		gradient: 'linear-gradient(135deg, #D4E8E4 0%, #E8F4F2 100%)',
		features: ['9 piezas que se apilan en el espacio de una', 'Incluye bowls mezcladores, coladores y medidores', 'Base antideslizante'],
	},
	{
		id: 'elevate',
		name: 'Elevate™',
		description: 'Utensilios de cocina con base elevada',
		category: 'Utensilios',
		gradient: 'linear-gradient(135deg, #F5E6D3 0%, #FFF5E8 100%)',
		features: ['Base elevada que evita el contacto con superficies', 'Diseño higiénico y funcional', 'Resistente al calor hasta 200°C'],
	},
	{
		id: 'tri-scale',
		name: 'Tri-Scale™',
		description: 'Balanza de cocina plegable compacta',
		category: 'Accesorios',
		gradient: 'linear-gradient(135deg, #E8E8E8 0%, #F0F0F0 100%)',
		features: ['Se pliega para almacenamiento compacto', 'Pantalla digital de fácil lectura', 'Pesa hasta 5kg con precisión de 1g'],
	},
	{
		id: 'dial',
		name: 'Dial™',
		description: 'Contenedor de almacenamiento con fecha ajustable',
		category: 'Almacenamiento',
		gradient: 'linear-gradient(135deg, #D8E8F0 0%, #E8F4F8 100%)',
		features: ['Dial de fecha para recordar frescura', 'Cierre hermético', 'Libre de BPA'],
	},
	{
		id: 'knives',
		name: 'Set de Cuchillos',
		description: 'Cuchillos de acero inoxidable con diseño premium',
		category: 'Preparación',
		gradient: 'linear-gradient(135deg, #C8C8C8 0%, #E0E0E0 100%)',
		features: ['Acero inoxidable japonés de alta calidad', 'Mangos ergonómicos antideslizantes', 'Incluye funda protectora'],
	},
	{
		id: 'extend',
		name: 'Extend™ Steel',
		description: 'Escurridor de platos expandible',
		category: 'Organización',
		image: 'https://www.josephjoseph.com/cdn/shop/files/851692_PDP_01.jpg',
		gradient: 'linear-gradient(135deg, #E8E8E8 0%, #F5F5F5 100%)',
		features: ['Se extiende para mayor capacidad', 'Bandeja de drenaje integrada', 'Acabado en acero inoxidable'],
		isNew: true,
	},
	{
		id: 'eclipse',
		name: 'Eclipse™',
		description: 'Tendedero de ropa de 3 niveles',
		category: 'Hogar',
		image: 'https://www.josephjoseph.com/cdn/shop/files/Media_Cutout_900x730_4c78bbf2-8859-46f3-ac03-590353073288.jpg',
		gradient: 'linear-gradient(135deg, #F5F0E8 0%, #FFFBF5 100%)',
		features: ['Tres niveles de secado', 'Diseño plegable', '20 metros de espacio de secado'],
		isNew: true,
	},
];
