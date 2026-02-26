import os
import json
import jwt
import datetime
from flask import Flask, request, jsonify, make_response
from functools import wraps
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

# Configuración secreta para los Tokens (Actividad E)
app.config['SECRET_KEY'] = 'mi_clave_super_secreta'
ARCHIVO_TAREAS = 'tareas.json'

# --- FUNCIONES DE AYUDA (Actividad D: Manejo de datos con fs/json) ---
def leer_tareas():
    if not os.path.exists(ARCHIVO_TAREAS):
        return []
    try:
        with open(ARCHIVO_TAREAS, 'r') as file:
            return json.load(file)
    except:
        return []

def guardar_tareas(tareas):
    with open(ARCHIVO_TAREAS, 'w') as file:
        json.dump(tareas, file, indent=4)

# --- MIDDLEWARE DE AUTENTICACIÓN (Actividad E) ---
def token_requerido(f):
    @wraps(f)
    def decorador(*args, **kwargs):
        token = None
        # Buscar el token en los headers
        if 'x-access-token' in request.headers:
            token = request.headers['x-access-token']
        
        if not token:
            return jsonify({'message': 'Falta el token de autenticacion'}), 401
        
        try:
            # Decodificar el token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        except:
            return jsonify({'message': 'Token invalido'}), 401
            
        return f(*args, **kwargs)
    return decorador

# --- RUTAS DE AUTENTICACIÓN (Actividad E) ---
usuarios_db = [] # Base de datos temporal en memoria para usuarios

@app.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    hashed_password = generate_password_hash(data['password'], method='pbkdf2:sha256')
    nuevo_usuario = {'username': data['username'], 'password': hashed_password}
    usuarios_db.append(nuevo_usuario)
    return jsonify({'message': 'Usuario registrado exitosamente'})

@app.route('/login', methods=['POST'])
def login():
    auth = request.get_json()
    
    if not auth or not auth.get('username') or not auth.get('password'):
        return make_response('No se pudo verificar', 401)

    usuario = next((user for user in usuarios_db if user['username'] == auth['username']), None)

    if not usuario:
         return make_response('Usuario no encontrado', 401)

    if check_password_hash(usuario['password'], auth['password']):
        # Generar Token que expira en 30 minutos
        token = jwt.encode({
            'user': usuario['username'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
        }, app.config['SECRET_KEY'], algorithm="HS256")

        return jsonify({'token': token})

    return make_response('Contrasena incorrecta', 401)

# --- RUTAS CRUD (Actividad C) ---

# GET /tareas
@app.route('/tareas', methods=['GET'])
def obtener_tareas():
    tareas = leer_tareas()
    return jsonify(tareas)

# POST /tareas (Protegida con token)
@app.route('/tareas', methods=['POST'])
@token_requerido  # <--- Solo usuarios con token pueden crear
def crear_tarea():
    data = request.get_json()
    tareas = leer_tareas()
    
    nueva_tarea = {
        'id': len(tareas) + 1,
        'titulo': data['titulo'],
        'descripcion': data['descripcion']
    }
    
    tareas.append(nueva_tarea)
    guardar_tareas(tareas)
    return jsonify({'message': 'Tarea creada', 'tarea': nueva_tarea}), 201

# PUT /tareas/<id>
@app.route('/tareas/<int:id>', methods=['PUT'])
@token_requerido
def actualizar_tarea(id):
    data = request.get_json()
    tareas = leer_tareas()
    
    tarea = next((t for t in tareas if t['id'] == id), None)
    
    if not tarea:
        return jsonify({'message': 'Tarea no encontrada'}), 404
        
    tarea['titulo'] = data.get('titulo', tarea['titulo'])
    tarea['descripcion'] = data.get('descripcion', tarea['descripcion'])
    
    guardar_tareas(tareas)
    return jsonify({'message': 'Tarea actualizada'})

# DELETE /tareas/<id>
@app.route('/tareas/<int:id>', methods=['DELETE'])
@token_requerido
def eliminar_tarea(id):
    tareas = leer_tareas()
    tareas_filtradas = [t for t in tareas if t['id'] != id]
    
    if len(tareas) == len(tareas_filtradas):
        return jsonify({'message': 'Tarea no encontrada'}), 404
        
    guardar_tareas(tareas_filtradas)
    return jsonify({'message': 'Tarea eliminada'})

# --- MANEJO DE ERRORES (Actividad F) ---
@app.errorhandler(500)
def error_servidor(e):
    return jsonify({'error': 'Ocurrio un error interno en el servidor'}), 500

@app.errorhandler(404)
def no_encontrado(e):
    return jsonify({'error': 'Ruta no encontrada'}), 404

if __name__ == '__main__':
    app.run(debug=True, port=5000)