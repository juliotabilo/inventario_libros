const express = require('express');
const router = express.Router();
const path = require('path');
const multer  = require('multer');
const conexion = require('./database/db');

/* Defino Variables de Multer (Uploader de archivos) */
var storage = multer.diskStorage({
    destination: (req, file, callBack) => {
        callBack(null, './public/portadas_libros/')   
    },
    filename: (req, file, callBack) => {
        callBack(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    }
})
 
var upload = multer({storage: storage});

// login 
router.post('/login', (req, res)=>{
    var values = [req.body.email , req.body.password]
    console.log(values);
    conexion.query('SELECT * FROM usuarios where username = ? AND password = ?',values ,(error, results)=>{
        if(error){
            throw error;
        } else {     
            if(results.length > 0){
                req.session.user = req.body.email;
                let data = {username:req.body.email,descripcion_accion:'Inicio de Sesión Correcto'};
                let sql = "INSERT INTO log_usuarios SET ?";
                conexion.query(sql,data);
                res.redirect('/route/dashboard');
            }   
            else{
                let data = {username:req.body.email,descripcion_accion:'Inicio de Sesión Erroneo'};
                let sql = "INSERT INTO log_usuarios SET ?";
                conexion.query(sql,data);
                res.render('base', { title: "Express", logout : "Datos Erroneos, vuelva a Intentarlo"})
            }              
        }   
    })

});

// eliminar libro
router.get('/delete/:id', (req, res) => {
    const id = req.params.id;
    conexion.query('DELETE FROM libros WHERE id = ?',[id], (error, results)=>{
        if(error){
            console.log(error);
        }else{      
            let data = {id_libro:id,descripcion_accion:'Eliminación de Libro',usuario_realiza:req.session.user};
            let sql = "INSERT INTO log_libros SET ?";
            conexion.query(sql,data);     
            res.redirect('/route/dashboard');
        }
    })
});

// editar libro
router.get('/edit/:id', (req,res)=>{    
    const id = req.params.id;
    conexion.query('SELECT id,nombre,autor,img_portada,date_format(fecha_creacion, "%d-%m-%Y") as fecha_creacion FROM libros WHERE id=?',[id] , (error, results) => {
        if (error) {
            throw error;
        }else{            
            res.render('edit.ejs', {libro:results[0]});            
        }        
    });
});

// log libro
router.get('/log_libro/:id', (req,res)=>{    
    const id = req.params.id;
    conexion.query('SELECT l.descripcion_accion, l.fecha_accion, DATE_FORMAT(l.fecha_accion," %d-%m-%Y %H:%i:%s") AS fecha_accion_formateada, lib.nombre FROM log_libros l join libros lib on l.id_libro=lib.id where l.id_libro = ?',[id] , (error, results) => {
        if (error) {
            throw error;
        }else{            
            res.render('log_libro.ejs', {log:results});            
        }        
    });
});

// mostrar página crear
router.get('/create', (req,res)=>{
    res.render('create');
})


// mostrar página Dashboard
router.get('/dashboard', (req, res) => {
    if(req.session.user){
        conexion.query('SELECT id,nombre,autor,img_portada,date_format(fecha_creacion, "%d-%m-%Y") as fecha_creacion FROM libros',(error, libros)=>{
            if(error){
                throw error;
            } else {                       
                res.render('dashboard', {libros:libros, nombre_usuario:req.session.user});            
            }   
        })
    }else{
        res.send("Debe Iniciar Sesión Primero.")
    }
})

router.get('/', (req, res)=>{     
   
})




// logout
router.get('/logout', (req ,res)=>{
    req.session.destroy(function(err){
        if(err){
            console.log(err);
            res.send("Error")
        }else{
            res.render('base', { title: "Express", logout : "Sesión Cerrada con exito!"})
        }
    })
})

// guardar libro
router.post("/save", upload.single('portada'), function (req, res, next) {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            errors: "No se seleccionó ninguna archivo"
        });
    } else {

        var imgsrc = 'http://localhost:3000/portadas_libros/' + req.file.filename
        let data = {nombre:req.body.nombre,autor:req.body.autor,fecha_creacion:req.body.fecha,img_portada:imgsrc};
        let sql = "INSERT INTO libros SET ?";
        conexion.query(sql,data, function(error,results){
            if(error){
                throw error;
            }
            else{
                var filas_insertadas= results.affectedRows;
                if (filas_insertadas>0){
                    // Poner Log de Creación Libro (Falta ID)
                    var id_insertado=results.insertId;
                    let data = {id_libro:id_insertado,descripcion_accion:'Modificación de Datos Libro',usuario_realiza:req.session.user};
                    let sql = "INSERT INTO log_libros SET ?";
                    conexion.query(sql,data);
                    console.log("Registro insertado con exito");
                    res.redirect('dashboard');

                }
            }
        });
    }
});

// actualizar libro
router.post('/update', (req, res) => {
    const id = req.body.id;
    const nombre = req.body.nombre;
    const autor = req.body.autor;
    const fecha = req.body.fecha;
    conexion.query('UPDATE libros SET ? WHERE id = ?',[{nombre:nombre, autor:autor}, id], (error, results)=>{
        if(error){
            console.log(error);
        }else{           
            let data = {id_libro:id,descripcion_accion:'Modificación de Datos Libro',usuario_realiza:req.session.user};
            let sql = "INSERT INTO log_libros SET ?";
            conexion.query(sql,data);
            res.redirect('dashboard');         
        }
});

});


router.get('/log_usuario', (req, res) => {
    if(req.session.user){
        var value = [req.session.user];
        conexion.query('SELECT descripcion_accion, fecha_accion, DATE_FORMAT(fecha_accion," %d-%m-%Y %H:%i:%s") AS fecha_accion_formateada FROM log_usuarios where username = ?',value ,(error, results)=>{
            if(error){
                throw error;
            } else {                       
                res.render('log_usuarios', {log:results, nombre_usuario:req.session.user});            
            }   
        })
    }else{
        res.send("Debe Iniciar Sesión Primero.")
    }
})

module.exports = router;