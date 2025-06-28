from flask import Flask, render_template, request, send_file #crear app y renderizar html
from langchain_community.llms import Ollama #ollama
from langchain_core.messages import HumanMessage, AIMessage #construir historial del chat y respuesta IA
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder #crear promt y meter el historial
from gtts import gTTS #pasar texto a audio
import os #manejar rutas

app = Flask(__name__) #crear aplicación Flask

#ruta absoluta al directorio donde está este archivo (app.py)
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

#ruta donde se va a guardar el audio
AUDIO_DIR = os.path.join(BASE_DIR, "static", "audio")
AUDIO_PATH = os.path.join(AUDIO_DIR, "respuesta.mp3")

#comprueba y si la carpeta no existe la crea
os.makedirs(AUDIO_DIR, exist_ok=True)

#cargar modelo llama3
llm = Ollama(model="llama3")
chat_history = [] #lista para guardar historial del chat

#llamar a llama
prompt_template = ChatPromptTemplate.from_messages([ 
    (
        "system",
        """Eres una IA llamada Carmen, respondes preguntas con respuestas simples,
        y haces preguntas relacionadas con el contexto. Eres una influencer virtual de 24 años, originaria de Sevilla
        en España. Eres experta en moda y orientas tus preguntas y respuestas a ello."""
    ),
    MessagesPlaceholder(variable_name="chat_history"),
    ("human", "{input}"),
])

chain = prompt_template | llm #une prompt y modelo para generar respuesta

#funcion que genera audio de un texto
def texto_a_voz(texto, nombre_archivo="respuesta.mp3"):
    ruta = os.path.join(AUDIO_DIR, nombre_archivo)
    tts = gTTS(text=texto, lang='es')
    tts.save(ruta)

#Flask
#ruta base
@app.route("/")
def index():
    return render_template("index.html")

#cuando se envia mensaje desde frontend
@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.form["message"]
    usar_audio = request.form.get("audio", "true").lower() == "true"
    #comprobar si se requiere el uso de audio desde el html

    response = chain.invoke({"input": user_input, "chat_history": chat_history})
    chat_history.append(HumanMessage(content=user_input))
    chat_history.append(AIMessage(content=response))

    #solo genera el audio del texto si se requiere
    if usar_audio:
        texto_a_voz(response)

    return {"respuesta": response}

#reproducir audio
@app.route("/audio")
def audio():
    return send_file(AUDIO_PATH, mimetype="audio/mpeg")

#iniciar el servidor al ejecutar app.py
if __name__ == "__main__":
    app.run(debug=True)
