const { Publicacion, Tag, Usuario, Imagen } = require('../models');
const { Op } = require('sequelize');

const searchController = {
    index: async (req, res) => {
        try {
            const user = req.session && req.session.user ? req.session.user : null;
            const q = req.query.q ? req.query.q.trim() : '';
            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            const limit = 12;
            const offset = (page - 1) * limit;

            if (!q) {
                return res.render('search/results', {
                    title: 'Buscar - PicME!',
                    publicaciones: [],
                    query: '',
                    currentPage: 1,
                    totalPages: 0,
                    totalResults: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                });
            }
            const searchTerm = q.toLowerCase();

            const buildImageInclude = () => {
                const imageInclude = {
                    model: Imagen,
                    as: 'imagenes'
                };

                if (!user) {
                    imageInclude.where = { copyright: 'sin_copyright' };
                    imageInclude.required = true;
                }

                return imageInclude;
            };

            const baseUserInclude =
            {
                model: Usuario,
                as: 'usuario',
                attributes: ['id', 'username', 'avatar', 'nombre']
            };




            //PRUEBA
            console.log('SEARCH USER?', !!user);
            console.log('IMAGE INCLUDE SEARCH:', buildImageInclude());




            
            const byContent = await Publicacion.findAll({
                where: {
                    activo: true,
                    [Op.or]: [
                        { titulo: { [Op.iLike]: `%${searchTerm}%` } },
                        { descripcion: { [Op.iLike]: `%${searchTerm}%` } }
                    ]
                },
                include: [buildImageInclude(), baseUserInclude, {
                    model: Tag,
                    as: 'tags',
                    through: { attributes: [] }
                }],
                order: [['created_at', 'DESC']]
            });

            const byTags = await Publicacion.findAll({
                where: { activo: true },
                include: [
                    buildImageInclude(),
                    baseUserInclude,
                    {
                        model: Tag,
                        as: 'tags',
                        where: { nombre: { [Op.iLike]: `%${searchTerm}%` } },
                        through: { attributes: [] }
                    }
                ],
                order: [['created_at', 'DESC']]
            });

            const byUser = await Publicacion.findAll({
                where: { activo: true },
                include: [
                    buildImageInclude(),
                    {
                        model: Usuario,
                        as: 'usuario',
                        attributes: ['id', 'username', 'avatar', 'nombre'],
                        where: { username: { [Op.iLike]: `%${searchTerm}%` } }
                    },
                    { model: Tag, as: 'tags', through: { attributes: [] } }
                ],
                order: [['created_at', 'DESC']]
            });

            const combinadas = [];
            const ids = new Set();

            for (const pub of [...byContent, ...byTags, ...byUser]) {
                if (!ids.has(pub.id)) {
                    ids.add(pub.id);
                    combinadas.push(pub);
                }
            }

            const totalResults = combinadas.length;
            const totalPages = Math.ceil(totalResults / limit);

            return res.render('search/results', {
                title: `Buscar: ${q} - PicME!`,
                publicaciones: combinadas.slice(offset, offset + limit),
                query: q,
                currentPage: page,
                totalPages,
                totalResults,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            });
        } catch (error) {
            console.error('Error en el buscador:', error);
            return res.status(500).render('errors/500');
        }
    }
};

module.exports = searchController;