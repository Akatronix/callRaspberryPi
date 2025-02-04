const socket = io.connect(window.location.origin);

let myStream;
let peer;
const myVideo = document.getElementById("myVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Initialize media stream
async function initMedia() {
  try {
    myStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    myVideo.srcObject = myStream;
    myVideo.muted = true;

    socket.emit("joinRoom");
  } catch (error) {
    console.error("Error accessing media devices:", error);
  }
}

// Create a peer connection
function createPeer(initiator, otherUserId) {
  const peerInstance = new SimplePeer({
    initiator,
    trickle: false,
    stream: myStream,
  });

  peerInstance.on("signal", (data) => {
    const event = initiator ? "sendOffer" : "sendAnswer";
    socket.emit(event, { target: otherUserId, signalData: data });
  });

  peerInstance.on("stream", (userStream) => {
    remoteVideo.srcObject = userStream;
  });

  peerInstance.on("error", (err) => console.error("Peer Error:", err));

  return peerInstance;
}

// Handle socket events
socket.on("userConnected", (otherUserId) => {
  console.log("New user connected:", otherUserId);
  peer = createPeer(true, otherUserId);
});

socket.on("offerReceived", ({ from, signal }) => {
  console.log("Offer received from:", from);
  peer = createPeer(false, from);
  peer.signal(signal);
});

socket.on("answerReceived", ({ signal }) => {
  console.log("Answer received");
  peer.signal(signal);
});

// Initialize media on page load
initMedia();
