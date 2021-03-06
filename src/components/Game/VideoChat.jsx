import React from 'react';
import {browserHistory} from 'react-router';

class VideoChat extends React.Component {
    constructor (props) {
        super ()
        this.state = {
            isChannelReady: false,
            isInitiator: false,
            isStarted: false
        }
    }
    componentDidMount() {
        var context = this;
        var pc;
        var localStream;
        var remoteStream;
        var turnReady;
        var room;
        //stun server for network data
        var pcConfig = {
            'iceServers': [{
                'url': 'stun:stun.l.google.com:19302'
            }]
        };
        // Set up audio and video regardless of what devices are present.
        var sdpConstraints = {
            'mandatory': {
                'OfferToReceiveAudio': true,
                'OfferToReceiveVideo': true
            }
        };

        //your screen is local video- other person is remote video
        var localVideo = document.querySelector('#localVideo');
        console.log("local video", localVideo.src);
        var remoteVideo = document.querySelector('#remoteVideo');
        socket.on('roomName', function(roomName) {
            room = roomName;
            socket.emit('create or join', room);
            navigator.mediaDevices.getUserMedia({
                audio: true,
                video: true
            })
                .then(gotStream)
                .catch(function(e) {
                    alert('getUserMedia() error: ' + e.name);
                });
            console.log('Room name : ', roomName);
        });


        socket.on('created', function(room) {
            console.log('Created room ' + room);
            context.setState({
                isInitiator: true
            })

        });

//once the second person joins, set channel to true
        socket.on('join', function (room){
            console.log('Another peer made a request to join room ' + room);
            context.setState({
                isChannelReady: true
            })
        });

        //socket.on('joined', function(room) {
        //    console.log('joined: ' + room);
        //    isChannelReady = true;
        //});

        socket.on('log', function(array) {
            console.log.apply(console, array);
        });

        socket.on('full', function(room){
            alert("Room is full");
        });

        function sendMessage(message) {
            console.log('Client sending message: ', message);
            socket.emit('message', message);
        }

// This client receives a message
        socket.on('message', function(message) {
            console.log('Client received message:', message);
            //if person initiates call, invoke start
            // else if person receives an offer, second person invokes start
            //else if person receives an answer from second person, set remote description
            if (message === 'got user media') {
                start();
            } else if (message.type === 'offer') {
                console.log("MAKING AN OFFER");
                if (!context.state.isInitiator && !context.state.isStarted) {
                    start();
                }
                pcConfig.setRemoteDescription(new RTCSessionDescription(message), function(){
                    createAnswer();
                    });

            } else if (message.type === 'answer' && context.state.isStarted) {
                pcConfig.setRemoteDescription(new RTCSessionDescription(message));
            } else if (message.type === 'candidate' && context.state.isStarted) {
                var candidate = new RTCIceCandidate({
                    sdpMLineIndex: message.label,
                    candidate: message.candidate
                });
                console.log("CANDIDATE:", candidate);
                pcConfig.addIceCandidate(candidate);
            } else if (message === 'bye' && context.state.isStarted) {
                handleRemoteHangup();
            }
        });


//set the local stream
        function gotStream(stream) {
            console.log('Adding local stream.');
            localVideo.src = window.URL.createObjectURL(stream);
            console.log("local video source", localVideo.src);
            localStream = stream;
            sendMessage('got user media');
            console.log("is initiator", context.state.isInitiator);
            if (context.state.isInitiator) {
                start();
            }
        }

        var constraints = {
            video: true
        };

        console.log('Getting user media with constraints', constraints);
        //
        //if (location.hostname !== 'localhost') {
        //    (
        //        'https://computeengineondemand.appspot.com/turn?username=41784574&key=4080218913'
        //    );
        //}

        function start() {
            console.log('>>>>>>> start ', context.state.isStarted, localStream, context.state.isChannelReady);
            if (!context.state.isStarted && typeof localStream !== 'undefined' && context.state.isChannelReady) {
                console.log('>>>>>> creating peer connection');
                createPeerConnection();
                pcConfig.addStream(localStream);
                context.setState({
                    isStarted: true
                });
                console.log('isInitiator', context.state.isInitiator);
                if (context.state.isInitiator) {
                    call();
                }
            }
        }

        window.onbeforeunload = function() {
            sendMessage('bye');
        };

/////////////////////////////////////////////////////////

        function createPeerConnection() {
            //create a new peer connection
            //add the ice handler
            try {
                pcConfig = new RTCPeerConnection(null);
                pcConfig.onicecandidate = handleIceCandidate;
                pcConfig.onaddstream = handleRemoteStreamAdded;
                pcConfig.onremovestream = handleRemoteStreamRemoved;
                console.log('Created RTCPeerConnnection');
            } catch (e) {
                console.log('Failed to create PeerConnection, exception: ' + e.message);
                alert('Cannot create RTCPeerConnection object.');
                return;
            }
        }

        function handleIceCandidate(event) {
            console.log('icecandidate event: ', event);
            if (event.candidate) {
                sendMessage({
                    type: 'candidate',
                    label: event.candidate.sdpMLineIndex,
                    id: event.candidate.sdpMid,
                    candidate: event.candidate.candidate
                });
            } else {
                console.log('End of candidates.');
            }
        }

        function handleRemoteStreamAdded(event) {
            console.log('Remote stream added.');
            remoteVideo.src = window.URL.createObjectURL(event.stream);
            remoteStream = event.stream;
        }

        function handleCreateOfferError(event) {
            console.log('createOffer() error: ', event);
        }
//initiate the offer and set the local description(your pc)
//on response set the remote description(other persons pc)
        function call() {
            console.log('Sending offer to peer');
            pcConfig.createOffer(setLocalAndSendMessage, handleCreateOfferError);
        }

        function createAnswer() {
            console.log('Sending answer to peer.');
            pcConfig.createAnswer().then(
                setLocalAndSendMessage,
                onCreateSessionDescriptionError
            );
        }

        function setLocalAndSendMessage(sessionDescription) {
            // Set Opus as the preferred codec in SDP if Opus is present.
            //  sessionDescription.sdp = preferOpus(sessionDescription.sdp);
            console.log("SESSIONDESCRIPTION:", sessionDescription);
            pcConfig.setLocalDescription(sessionDescription);
            console.log('setLocalAndSendMessage sending message', sessionDescription);
            sendMessage(sessionDescription);
        }

        function onCreateSessionDescriptionError(error) {
            console.log('Failed to create session description: ' + error.toString());
        }
        //NOT BEING USED RIGHT NOW
//TURN servers- if ICE cant find the external address, traffic will be routed using turn servers
//        function requestTurn(turnURL) {
//            var turnExists = false;
//            for (var i in pcConfig.iceServers) {
//                if (pcConfig.iceServers[i].url.substr(0, 5) === 'turn:') {
//                    turnExists = true;
//                    turnReady = true;
//                    break;
//                }
//            }
//            if (!turnExists) {
//                console.log('Getting TURN server from ', turnURL);
//                // No TURN server. Get one from computeengineondemand.appspot.com:
//                var xhr = new XMLHttpRequest();
//                xhr.onreadystatechange = function() {
//                    if (xhr.readyState === 4 && xhr.status === 200) {
//                        var turnServer = JSON.parse(xhr.responseText);
//                        console.log('Got TURN server: ', turnServer);
//                        pcConfig.iceServers.push({
//                            'url': 'turn:' + turnServer.username + '@' + turnServer.turn,
//                            'credential': turnServer.password
//                        });
//                        turnReady = true;
//                    }
//                };
//                xhr.open('GET', turnURL, true);
//                xhr.send();
//            }
//        }

        function handleRemoteStreamAdded(event) {
            console.log('Remote stream added.');
            remoteVideo.src = window.URL.createObjectURL(event.stream);

            remoteStream = event.stream;
        }

        function handleRemoteStreamRemoved(event) {
            console.log('Remote stream removed. Event: ', event);
        }

        function hangup() {
            console.log('Hanging up.');
            stop();
            sendMessage('bye');
        }

        function handleRemoteHangup() {
            console.log('Session terminated.');
            stop();
            context.setState({
                isInitiator: false
            });
        }

        function stop() {
            context.setState({
                isStarted: false
            });
            // isAudioMuted = false;
            // isVideoMuted = false;
            pcConfig.close();
            pcConfig = null;
            localVideo.src = null;
            remoteVideo.src = null;
            document.getElementById("canvas").remove();
            browserHistory.push({
                pathname: '/'
            });
            location.reload();
        }

///////////////////////////////////////////
//NOT BEING USED RIGHT NOW
// Set Opus as the default audio codec if it's present.
//        function preferOpus(sdp) {
//            var sdpLines = sdp.split('\r\n');
//            var mLineIndex;
//            // Search for m line.
//            for (var i = 0; i < sdpLines.length; i++) {
//                if (sdpLines[i].search('m=audio') !== -1) {
//                    mLineIndex = i;
//                    break;
//                }
//            }
//            if (mLineIndex === null) {
//                return sdp;
//            }
//
//            // If Opus is available, set it as the default in m line.
//            for (i = 0; i < sdpLines.length; i++) {
//                if (sdpLines[i].search('opus/48000') !== -1) {
//                    var opusPayload = extractSdp(sdpLines[i], /:(\d+) opus\/48000/i);
//                    if (opusPayload) {
//                        sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex],
//                            opusPayload);
//                    }
//                    break;
//                }
//            }
//
//            // Remove CN in m line and sdp.
//            sdpLines = removeCN(sdpLines, mLineIndex);
//
//            sdp = sdpLines.join('\r\n');
//            return sdp;
//        }

        //function extractSdp(sdpLine, pattern) {
        //    var result = sdpLine.match(pattern);
        //    return result && result.length === 2 ? result[1] : null;
        //}

// Set the selected codec to the first in m line.
//        function setDefaultCodec(mLine, payload) {
//            var elements = mLine.split(' ');
//            var newLine = [];
//            var index = 0;
//            for (var i = 0; i < elements.length; i++) {
//                if (index === 3) { // Format of media starts from the fourth.
//                    newLine[index++] = payload; // Put target payload to the first.
//                }
//                if (elements[i] !== payload) {
//                    newLine[index++] = elements[i];
//                }
//            }
//            return newLine.join(' ');
//        }

// Strip CN from sdp before CN constraints is ready.
//        function removeCN(sdpLines, mLineIndex) {
//            var mLineElements = sdpLines[mLineIndex].split(' ');
//            // Scan from end for the convenience of removing an item.
//            for (var i = sdpLines.length - 1; i >= 0; i--) {
//                var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
//                if (payload) {
//                    var cnPos = mLineElements.indexOf(payload);
//                    if (cnPos !== -1) {
//                        // Remove CN payload from m line.
//                        mLineElements.splice(cnPos, 1);
//                    }
//                    // Remove CN line in sdp
//                    sdpLines.splice(i, 1);
//                }
//            }
//
//            sdpLines[mLineIndex] = mLineElements.join(' ');
//            return sdpLines;
//        }

    }
    render () {
        return (
            <div id="videos">
                <video id="localVideo" autoPlay muted></video>
                <video id="remoteVideo" autoPlay></video>
            </div>
        );
    }
}

export default VideoChat;