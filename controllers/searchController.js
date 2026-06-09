const { Publicacion, Tag, Usuario } = require('../models');
const { Op } = require('sequelize');

const searchController = {
    index: async (req, res) => {
        try {
            const q = req.query.q ? req.query.q.trim() : '';
            if (!q) {
                return res.render('search/results', {
                    publicaciones: [],
                    query: q
                });
            }
            const publicaciones = await Publicacion.findAll({
                where: {

                    [Op.or]: [
                        { titulo: { [Op.iLike]: `%${q}%` } },
                        { descripcion: { [Op.iLike]: `%${q}%` } }
                    ]
                },
                include: [
                    {
                        model: Tag,
                        as: 'Tags', 
                        where: {
                            nombre: { [Op.iLike]: `%${q}%` }
                        },
                        required: false 
                    },
                    {
                        model: Usuario,
                        as: 'Usuario', 
                        attributes: ['id', 'nombre'] 
                    }
                ],
                order: [['created_at', 'DESC']], 
            });
            return res.render('search/results', {
                publicaciones,
                query: q
            });

        } catch (error) {
            console.error('Error en el buscador:', error);
            return res.status(500).render('errors/500');
        }
    }
};

module.exports = searchController;