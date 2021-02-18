# https://stackoverflow.com/questions/58931854/how-to-stream-live-video-frames-from-client-to-flask-server-and-back-to-the-clie
from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import io
import speech_recognition as sr
import base64
from scipy.io.wavfile import read, write
import os

app = Flask(__name__)
socketio = SocketIO(app)


@app.route('/', methods=['POST', 'GET'])
def index():
    return render_template('index2.html')

@socketio.on('speech')
def speech(message):
    message = message['audio']['dataURL'].replace('data:audio/wav;base64,','')
    print(type(message))
    # sbuf = io.StringIO()
    # sbuf.write(message)
    # print(message)

    # decode and convert into image
    b = io.BytesIO(base64.b64decode(message))
    print('b:',type(b))
    r = sr.Recognizer()
    if os.path.isfile('myfile.wav'):
        os.remove('myfile.wav')
    try:
        with open('myfile.wav', mode='bx') as f:
            f.write(b.getvalue())
        f.close()
    except: 
        pass
    
    
        

    # emit the frame back
    # emit('response_back', stringData)


if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1')