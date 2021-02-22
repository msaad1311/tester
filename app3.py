# https://stackoverflow.com/questions/58931854/how-to-stream-live-video-frames-from-client-to-flask-server-and-back-to-the-clie
# https://towardsdatascience.com/machine-translation-with-transformers-using-pytorch-f121fe0ad97b
from flask import Flask, render_template,flash
from flask_socketio import SocketIO, emit
import io
import speech_recognition as sr
from googletrans import Translator
import base64
from scipy.io.wavfile import read, write
import os
from transformers import AutoModelWithLMHead, AutoTokenizer,pipeline
from PIL import Image
import imutils
import cv2
import numpy as np

app = Flask(__name__)
socketio = SocketIO(app)
fileName = 'myfile.wav'
model = AutoModelWithLMHead.from_pretrained("Helsinki-NLP/opus-mt-en-es")
tokenizer = AutoTokenizer.from_pretrained("Helsinki-NLP/opus-mt-en-es")

@app.route('/', methods=['POST', 'GET'])
def index():
    return render_template('home.html')

@app.route('/audio',methods=['GET','POST'])
def audio():
    return render_template('audio.html')

@app.route('/video',methods=['GET','POST'])
def video():
    return render_template('video.html')

@socketio.on('speech')
def speech(message):
    message = message['audio']['dataURL'].replace('data:audio/wav;base64,','')
    print(type(message))
    # sbuf = io.StringIO()
    # sbuf.write(message)
    # print(message)

    # decode and convert into image
    b = io.BytesIO(base64.b64decode(message))
    r = sr.Recognizer()
    if os.path.isfile(fileName):
        os.remove(fileName)
    try:
        with open(fileName, mode='bx') as f:
            f.write(b.getvalue())
        f.close()
    except: 
        pass
    
    with sr.AudioFile(fileName) as source:
        print('into the reusable')
        data= r.record(source)
        try:
            text = r.recognize_google(data)
            print(text)
            translation = pipeline("translation_en_to_es", model=model, tokenizer=tokenizer)
            translated = translation(text)[0]['translation_text']
            print(translated)
            result = [text,translated]
            emit('messageBack', result)
        except Exception as e:
            emit('errorMessage')
            print("Exception: "+str(e))

@socketio.on('image')
def image(data_image):
    print('hinto the image function')
    sbuf = io.StringIO()
    sbuf.write(data_image)
    # print(data_image)
    # with open('test.txt','w') as f:
    #     f.write(data_image)
    # decode and convert into image
    b = io.BytesIO(base64.b64decode(data_image))
    pimg = Image.open(b)

    ## converting RGB to BGR, as opencv standards
    frame = cv2.cvtColor(np.array(pimg), cv2.COLOR_RGB2GRAY)

    # Process the image frame
    frame = imutils.resize(frame, width=700)
    frame = cv2.flip(frame, 1)
    imgencode = cv2.imencode('.jpg', frame)[1]

    # base64 encode
    stringData = base64.b64encode(imgencode).decode('utf-8')
    b64_src = 'data:image/jpg;base64,'
    stringData = b64_src + stringData

    # emit the frame back
    emit('response_back', stringData)

    
if __name__ == '__main__':
    socketio.run(app, host='127.0.0.1')