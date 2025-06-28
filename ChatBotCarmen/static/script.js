//Funcion para cambiar el estado y reproducir el gif correspondiente
function cambiarEstadoGIF(estado) {
	const estados = ["esperando", "pensando", "hablando"];
	estados.forEach(id => {
		const el = document.getElementById(id);
		el.classList.toggle("activo", id === estado); //Muestra el gif estado correspondiente
	});

	const estadoTexto = {
		esperando: "Esperando tu mensaje ⌛...",
		pensando: "Pensando 🤔...",
		hablando: "Hablando 🗣️..."
	};

	const estadoElemento = document.getElementById("estado-carmen");
	if (estadoElemento) {
		estadoElemento.textContent = "Estado: " + (estadoTexto[estado] || ""); //Actualiza el estado
	}
}

//Funcion para escribir el texto poco a poco. parametro velocidad establece el periodo
//de tiempo que tarda en escribirse una nueva palabra. 
function escribirTextoGradualmente(elemento, texto, velocidad = 65, callback = null) {
	let i = 0;
	const intervalo = setInterval(() => {
		if (i < texto.length) {
			elemento.textContent += texto[i++];
			autoScrollChat();
		} else {
			clearInterval(intervalo);
			if (callback) callback();
		}
	}, velocidad);
}

//Funcion que desplaza el chat automaticamente hasta abajo a medida que se escribe el mensaje
function autoScrollChat() {
	const log = document.getElementById("chat-log");
	log.scrollTop = log.scrollHeight;
}

//enviar mensaje al backend
function enviar() {
	const input = document.getElementById("user-input");
	const mensaje = input.value.trim();
	const audioActivado = document.getElementById("toggle-audio").checked;
	const enviarBtn = document.getElementById("enviar-btn");

	if (!mensaje) return;

	enviarBtn.disabled = true;
	cambiarEstadoGIF("pensando");

	const log = document.getElementById("chat-log");

	const mensajeUsuario = document.createElement("div");
	mensajeUsuario.className = "mensaje usuario";
	mensajeUsuario.textContent = mensaje;
	log.appendChild(mensajeUsuario);

	const respuestaElemento = document.createElement("div");
	respuestaElemento.className = "mensaje carmen";
	respuestaElemento.innerHTML = '<div class="escribiendo"><span>●</span><span>●</span><span>●</span></div>';
	log.appendChild(respuestaElemento);

	input.value = "";
	autoScrollChat();
	
	//enviar datos con fetch
	fetch("/chat", {
		method: "POST",
		headers: { "Content-Type": "application/x-www-form-urlencoded" },
		body: "message=" + encodeURIComponent(mensaje) + "&audio=" + audioActivado
	})
	.then(res => res.json())
	.then(data => {
		cambiarEstadoGIF("hablando");

		respuestaElemento.textContent = "";
		escribirTextoGradualmente(respuestaElemento, data.respuesta, 65, () => {
			cambiarEstadoGIF("esperando");
		});

		//solo reproduce audio si esta activada la opcion
		if (audioActivado) {
			const audio = new Audio("/audio?" + new Date().getTime());
			audio.play();
			audio.onended = () => {
				cambiarEstadoGIF("esperando");
			};
		} else {
			cambiarEstadoGIF("esperando");
		}
	});
}

const input = document.getElementById("user-input");
const enviarBtn = document.getElementById("enviar-btn");

//Desactiva el boton de enviar si el input no tiene texto
input.addEventListener("input", () => {
	enviarBtn.disabled = input.value.trim() === "";
});

//envia mensajes al pulsar boton enter, y no solo cuando pulsas con la flecha del raton
input.addEventListener("keypress", function (e) {
	if (e.key === "Enter" && !enviarBtn.disabled) {
		e.preventDefault();
		enviar();
	}
});

//modo oscuro al pulsar el checkbox
document.getElementById("toggle-tema").addEventListener("change", function() {
	document.body.classList.toggle("oscuro", this.checked);
});