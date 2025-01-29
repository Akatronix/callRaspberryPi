const socket = io.connect(window.location.origin);

let myStream;
let peer;
const myVideo = document.getElementById("myVideo");
const remoteVideo = document.getElementById("remoteVideo");

// Get user media (video & audio)
navigator.mediaDevices
  .getUserMedia({ video: true, audio: true })
  .then((stream) => {
    myStream = stream;
    myVideo.srcObject = stream;
    myVideo.muted = true; // Prevent self-audio loop

    socket.emit("joinRoom"); // Notify server that user joined

    socket.on("userConnected", (otherUserId) => {
      console.log("New user connected:", otherUserId);

      // Create a peer connection (initiator = true means this user is calling)
      peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: myStream,
      });

      peer.on("signal", (data) => {
        socket.emit("sendOffer", { target: otherUserId, signalData: data });
      });

      peer.on("stream", (userStream) => {
        remoteVideo.srcObject = userStream;
      });

      peer.on("error", (err) => console.error("Peer Error:", err));
    });

    socket.on("offerReceived", ({ from, signal }) => {
      console.log("Offer received from:", from);

      // Create a peer connection (initiator = false means this user is answering)
      peer = new SimplePeer({
        initiator: false,
        trickle: false,
        stream: myStream,
      });

      peer.on("signal", (data) => {
        socket.emit("sendAnswer", { target: from, signalData: data });
      });

      peer.on("stream", (userStream) => {
        remoteVideo.srcObject = userStream;
      });

      peer.on("error", (err) => console.error("Peer Error:", err));

      // Accept incoming WebRTC signal
      peer.signal(signal);
    });

    socket.on("answerReceived", (signal) => {
      console.log("Answer received, completing connection");
      peer.signal(signal);
    });
  })
  .catch((error) => {
    console.error("Error accessing media devices:", error);
  });
