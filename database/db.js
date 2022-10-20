const mysql = require('mysql');
const conexion = mysql.createConnection({
  host: "remotemysql.com",
  user: "tSRvEvwMvT",
  password: "4knalUgQPQ",
  database: "tSRvEvwMvT"
});
conexion.connect((error)=>{
    if (error) {
      console.error('El error de conexión es: ' + error);
      return;
    }
    console.log('¡Conectado a la Base de Datos!');
  });
module.exports = conexion;