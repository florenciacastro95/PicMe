const { Publicacion, Tag, Usuario, Imagen } = require('../models');
const { Op } = require('sequelize');

const searchController = {
    index: async (req, res) => {
        try {
            const user = req.session && req.session.user ? req.session.user : null;
            const q = req.query.q ? req.query.q.trim() : '';

            const filterType = req.query.filterType || 'all';
            const copyrightFilter = req.query.copyright || 'all';
            const tagFilter = req.query.tag ? req.query.tag.trim() : '';


            const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
            const limit = 12;
            const offset = (page - 1) * limit;


            let usuariosEncontrados = [];
            let publicacionesEncontradas = [];
            let totalResults = 0;
            let totalPages = 0;

            if (filterType === 'all' || filterType === 'usuarios') {
                const whereUsuario = { activo: true };

                if (q) {
                    whereUsuario[Op.or] = [
                        { username: { [Op.iLike]: `%${q}%` } },
                        { nombre: { [Op.iLike]: `%${q}%` } }
                    ];
                }

                usuariosEncontrados = await Usuario.findAll({
                    where: whereUsuario,
                    attributes: ['id', 'username', 'nombre', 'avatar'],
                    limit: 30
                });
            }
            if (filterType === 'all' || filterType === 'publicaciones') {
                const wherePublicacion = { activo: true };
                const andConditions = [];

                if (q) {
                    andConditions.push({
                        [Op.or]: [
                            { titulo: { [Op.iLike]: `%${q}%` } },
                            { descripcion: { [Op.iLike]: `%${q}%` } },
                            { '$usuario.username$': { [Op.iLike]: `%${q}%` } },
                            { '$usuario.nombre$': { [Op.iLike]: `%${q}%` } },
                            { '$tags.nombre$': { [Op.iLike]: `%${q}%` } }
                        ]
                    });
                }

                if (tagFilter) {
                    andConditions.push({
                        '$tags.nombre$': { [Op.iLike]: `%${tagFilter}%` }
                    });
                }

                if (andConditions.length > 0) {
                    wherePublicacion[Op.and] = andConditions;
                }

                const includeFiltro = [
                    { model: Usuario, as: 'usuario', attributes: [] },
                    { model: Tag, as: 'tags', attributes: [], through: { attributes: [] } }
                ];

                const imageIncludeFiltro = { model: Imagen, as: 'imagenes', attributes: [] };
                if (!user) {
                    imageIncludeFiltro.where = { copyright: 'sin_copyright' };
                    imageIncludeFiltro.required = true;
                    includeFiltro.push(imageIncludeFiltro);
                } else if (copyrightFilter !== 'all') {
                    imageIncludeFiltro.where = { copyright: copyrightFilter };
                    imageIncludeFiltro.required = true;
                    includeFiltro.push(imageIncludeFiltro);
                }

                
                const publicacionesFiltradas = await Publicacion.findAll({
                    where: wherePublicacion,
                    include: includeFiltro,
                    attributes: ['id', 'created_at'],
                    group: ['Publicacion.id', 'Publicacion.created_at'],
                    order: [['created_at', 'DESC']]
                });

                const todosLosIds = publicacionesFiltradas.map(p => p.id);
                totalResults = todosLosIds.length;
                totalPages = Math.ceil(totalResults / limit);


                const idsPaginados = todosLosIds.slice(offset, offset + limit);


                let rows = [];
                if (idsPaginados.length > 0) {
                    rows = await Publicacion.findAll({
                        where: { id: idsPaginados },
                        include: [
                            { model: Imagen, as: 'imagenes' },
                            {
                                model: Usuario,
                                as: 'usuario',
                                attributes: ['id', 'username', 'nombre', 'avatar']
                            },
                            {
                                model: Tag,
                                as: 'tags',
                                through: { attributes: [] }
                            }
                        ],
                        order: [['created_at', 'DESC']]
                    });
                }
                publicacionesEncontradas = rows.map(pubInstance => {
                    const pub = pubInstance.get({ plain: true });
                    pub.copyright = (pub.imagenes && pub.imagenes.length > 0) ? pub.imagenes[0].copyright : null;
                    return pub;
                });
            }


            return res.render('search/results', {
                title: `Buscar: ${q} - PicME!`,
                publicaciones: publicacionesEncontradas,
                usuarios: usuariosEncontrados,
                query: q,
                filterType,
                copyrightFilter,
                tagFilter,
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