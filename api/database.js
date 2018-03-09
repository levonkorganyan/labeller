const Sequelize = require('sequelize');

export const db = new Sequelize('database', 'username', 'password', {
  host: 'localhost',
  dialect: 'sqlite',
  storage: './db.sqlite',
  define: {
    underscored: true
  }
});

export const Images = db.define('images', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false
  },
  url: {
    type: Sequelize.STRING,
    required: true
  }
});

export const Classes = db.define('classes', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false
  },
  name: {
    type: Sequelize.STRING,
    required: true
  }
});

export const Labels = db.define('labels', {
  id: {
    type: Sequelize.UUID,
    primaryKey: true,
    defaultValue: Sequelize.UUIDV4,
    allowNull: false
  },
  image_id: {
    type: Sequelize.UUID,
    allowNull: false
  },
  class_id: {
    type: Sequelize.UUID,
    allowNull: false
  },
  top: Sequelize.INTEGER,
  left: Sequelize.INTEGER,
  width: Sequelize.INTEGER,
  height: Sequelize.INTEGER
});

Labels.belongsTo(Images);
Images.hasMany(Labels);

Labels.belongsTo(Classes);
Classes.hasMany(Labels);
