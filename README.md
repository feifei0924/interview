# WebRTC 入门介绍

> author: yufei123@kakamf.com

## WebRTC简要介绍

**WebRTC目的是通过一系列的协议和规范来让浏览器提供支持实时通讯功能的API接口。**
它允许客户端之间可以不借助中间媒介的情况下，建立点对点的连接，实现视频流和音频流或者其他任意数据的传输 。WebRTC提供了浏览器端的P2P通信，但并不意味着WebRTC不需要服务器，至少以下两种服务器是必须的：

　　**浏览器之间建立通信前交换各种元数据（信令）的服务器（信令服务）：**
元数据是通过信令服务器中转发给另一个客户端，但是对于流媒体数据，一旦会话建立，首先尝试使用点对点连接。信令就是协调通讯的过程，一旦信令服务建立好了，两个客户端之间建立了连接，理论上它们就可以进行点对点通讯了。
      
　　**穿越NAT和防火墙的服务器（stun、turn等）：**
现实网络环境有三种：公共网络：这类网络IP之间可以不受限制地进行互相访问；NAT网络：这类网络主机在私有内网中，没有单独的公网IP( 使用STUN协议解决 )；严格受限的NAT网络：这类网络中的主机在内网内，只能单向访问外网，外网不能直接访问它，需要通过在公共网络上的服务器来进行数据中转( 使用TURN协议解决 )。
  
　　- STUN ( Session Traversal Utilities for NAT，简单地用UDP穿透NAT) 服务器：用来取外网地址的。
　　- TURN (使用中继穿透NAT) 服务器：在P2P失败时进行转发的。
　　- ICE ( Interactive Connectivity Establishment , 即交互式连通建立方式 )：它通过综合利用现有NAT穿透协议，以一种更有效的方式来组织会话建立过程，使之在不增加任何延迟同时比STUN等单一协议更具有健壮性、灵活性。

### WebRTC提供了三个核心的API：

**（1）MediaStream：**
  负责获取用户本地的多媒体数据，提供了通过设备的摄像头及话筒获得视频、音频的同步流的功能。
    通过调用navigator.getUserMedia() 获取，接受三个参数：
        约束对象（constraints object），表示要获取哪些多媒体设备、
        调用成功的回调函数，如果调用成功，传递给它一个流对象（每个流对象可能有好几个轨道），
        以及一个调用失败的回调函数，如果调用失败，传递给它一个错误对象
        
**（2）RTCPeerConnection:**
  用于连接建立音频视频媒体流传输。在浏览器之间传递流数据，这个流数据通道是点对点的，不需要经过服务器进行中转。建立实例之后，想要使用其建立一个点对点的信道，我们需要做两件事：
    确定本机上的媒体流的特性（SDP描述符）：SDP ( Session Description Protocol ) 涵盖了一个指定用户的描述、时间配置和对媒体的限制，类似于你电脑的名片，其他用户可以通过它来试着联系到你。
    连接两端的主机的网络地址（ICE Candidate）：ICE是交互式连通性建立（Interactive Connectivity Establishment）的缩写，它定义了一种系统化的方式来寻找两个端点（通过NAT和防火墙）之间可能的通信选项，包括必要时使用中继。最后ICE则是一个将STUN和TURN结合在一起的标准，它会判断主机是上面三种类型之一，并用相应的方法来建立主机之间的连接
  由于主机可能位于防火墙或NAT之后，在进行P2P通信之前，我们需要进行检测以确认它们之间能否进行P2P通信以及如何通信。通过ICE框架来建立点与点之间的网络路径，使用STUN服务器（确定双方的可公开访问你的IP地址和端口）以及TURN服务器（如果直接连接失败，就必须数据中继了），在创建实例的时候就将服务器地址传入。
  WebRTC通过offer和answer请求交换SDP描述符。
  
**（3）RTCDataChannel:**
  数据传输通道，是浏览器之间建立的非媒体的交互连接，通信在浏览器之间直接连接。DataChannel是建立在PeerConnection上的，不能单独使用。
  
## WebRTC Demo 介绍

  通过Demo实现一对一视频通话，使用Google提供的公共STUN服务器获取即将建立TCP连接的IP地址和端口号，使用Scaledrone建立信令。通信流程：两个客户端之间通过自己的公网IP地址，使用STUN协议信息和STUN服务器建立联系；通过SDP提供/应答机制，使用呼叫控制信令消息交换它们已发现的公共IP地址；执行连接检查，确保P2P可以连接；建立连接后，实时通信。
 
- **HTML部分：**
主要是创建了两个video元素，一个显示本地产生的视频流，为了听见远程视频声音，本地音频元素设置为静音，一个显示对等端传输的视频。

```
  <div class="copy">Send your URL to a friend to start a video call</div>
  <video id="localVideo" autoplay muted></video>
  <video id="remoteVideo" autoplay></video> 
```
 
- **Scaledrone信令部分：**
  链接进入Scaledrone之后，加入一个专属频道的房间内，信息只在房间内传递。房间有个members事件，会告知房间内成员信息（设置当成员超过两人以上弹窗告知房间已满）
  如果当前用户是房间第一人的时候，启动WebRTC代码，生成本地音频，视频流并显示出来，之后等待别的用户申请加入的信息并回答；若当前用户是房间第二人的时候，音频视频流同第一人操作相同，不同的是第二人将发送offer 给房间第一个成员，并触发onicecandidate 事件发送信令信息。
 
- **WebRTC部分：**
  每一个客户端都要完成WebRTC的流程：
    获取本地的音频，视频流并添加到MediaStream中，准备发送给对等端。创建一个指定icesever的RTCPeerConnection对象。建立一个icecandidate事件的回调函数，发生该事件时将ICE候选路径消息封装在candidate通过信令通道发送给即将连接的对等端，对等端收到ICE candidate信令之后通过addIceCandidate()将其加入到本端PC实例中。建立一个track事件的响应程序，这个事件会在远程端添加一个track RTCPeerConnection对象到其MediaStream上时被触发，本地获取远程媒体流并显示在页面上。之后通过offer/answer 信令和icecandidate 信令传给对等端。信息交互之后，两端都有自己和对方的SDP信息和网络地址，这样双方就能建立端对端连接，向连接对象添加媒体流，连接对象就能读出媒体流并显示出来。

``` JS 代码
// Scaledrone的一个实例建立了一个连接，连接到一个频道
// CYBEREITS Channel ID ：AIEjzcTbyzUcnOWo
const drone = new ScaleDrone('AIEjzcTbyzUcnOWo');

// 根据需要随机生成房间名称
if (!location.hash) {
  location.hash = Math.floor(Math.random() * 0xFFFFFF).toString(16);
}
const roomHash = location.hash.substring(1);

// 可观察房间必须加上 ‘observable-’ 前缀
// 可观察的房间提供了跟踪连接用户和将消息链接到用户的附加功能。
const roomName = 'observable-' + roomHash;

// configuration会传给RTCPeerConnection实例。使用Google的公共 STUN服务器。
const configuration = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};

let room;
let pc;

// onSuccess和onError函数会被用来进行更清晰的回调处理。
function onSuccess() {
  console.log("Successful !!!")
};
function onError(error) {
  console.error(error);
};

drone.on('open', error => {
  if (error) {
    return console.error(error);
  }

  // 所有信息在房间内传送
  // 需要订阅特定的房间收听消息
  room = drone.subscribe(roomName);
  room.on('open', error => {
    if (error) {
      onError(error);
    }
  });

  // 连接房间之后，members事件会告知谁连接到房间并接收到一系列成员
  room.on('members', members => {
    if(members.length >= 3) {
      return alert("The room is full")
    }
    const isOfferer = members.length === 2;
    startWebRTC(isOfferer);
  });

});

// 通过 Scaledrone 发送信令数据
function sendMessage(message) {
  // drone.publish 发送消息给房间内的用户
  drone.publish({
    room: roomName,
    message
  });
}

// localDescCreated在创建请求以及响应的时候被调用。它会更新对于连接的本地描述。
function localDescCreated(desc) {
  // 将创建的SDP对象保存起来
  pc.setLocalDescription(
    desc,
    // localDescription返回一个RTCSessionDescription，它描述连接本地端的会话。如果它还没有被设置，这是空的。
    () => sendMessage({'sdp': pc.localDescription}),
    onError
  );
}

function startWebRTC(isOfferer) {
  // pc表示的是本地电脑和远端对等端之间的WebRTC连接
  // pc 用来表示WebRTC会话端
  pc = new RTCPeerConnection(configuration);
  
  // 返回本地产生的 ICE候选项来信令给其他用户。我们将它传递给我们的信令服务
  // 当本地ICE代理需要通过信令服务器向另一个对等点发送消息时触发要调用的函数
  // 发送ICE候选到其他客户端
  pc.onicecandidate = event => {
    if (event.candidate) {
      sendMessage({'candidate': event.candidate});
    }
  };

  if (isOfferer) {
    // 如果当前用户是房间第二个用户，通过 ‘onnegotiationneeded’ 创建 offer
    // 当发生改变需要进行会话协商时被触发。这个事件开启createOffer处理，并且只会被请求方用户处理。
    pc.onnegotiationneeded = () => {
      // createOffer方法创建一个用于offer的SDP对象，SDP对象涵盖了一个指定用户的描述、时间配置和对媒体的限制，保存当前音视频的相关参数
      pc.createOffer().then(localDescCreated).catch(onError);
    }
  }

  // 建立一个track事件的响应程序，这个事件会在远程Peer添加一个track到其stream上时被触发
  // 该event对象将在MediaStreamTrack被创建时或者是关联到已被添加到接收集合的RTCRtpReceiver对象中时被发送
  pc.ontrack = event => {
    const stream = event.streams[0];
    if (!remoteVideo.srcObject || remoteVideo.srcObject.id !== stream.id) {
      // 当远程媒体流到达时，在 #remoteVideo 元素中显示出来
      remoteVideo.srcObject = stream;
    }
  };

  // 获取本地视频音频流数据
  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  }).then(stream => {
    // 在 #localVideo 元素中显示本地视频
    localVideo.srcObject = stream;
    // 添加当前数据流，发送给对等端
    // MediaStream.getTracks() 返回流中所有的MediaStreamTrack列表。
    // RTCPeerConnection.addTrack()将一个新媒体轨道添加到一组将被传输到另一个对等点的轨道中
    stream.getTracks().forEach(track => pc.addTrack(track, stream));
  }, onError);

  room.on('data', (message, client) => {
    
    if (client.id === drone.clientId) {
      // 如果当前用户ID是频道用户ID(第一个用户)，即自己发送的消息，直接返回
      return;
    }

    if (message.sdp) {
      // message.sdp – 会话描述协议是一个描述远程连接本低端的字符串。从另一端接收到请求或者应答之后我们就可以回应它
      // RTCPeerConnection.setRemoteDescription() 方法改变与连接相关的描述，该描述主要是描述有些关于连接的属性
      // 方法带三个参数，RTCSessionDescription 对象用于设置，然后是更改成功的回调方法，一个是更改失败的回调方法。
      pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
        // 当收到 offer 时响应它
        if (pc.remoteDescription.type === 'offer') {
          pc.createAnswer().then(localDescCreated).catch(onError);
        }
      }, onError);
    } else if (message.candidate) {
      // RTCPeerConnection.addIceCandidate() 在我们连接远端描述中加入新的 ICE候选
      pc.addIceCandidate(
        // RTCIceCandidate 表示候选Internet连接建立(ICE)配置
        new RTCIceCandidate(message.candidate), onSuccess, onError
      );
    }
  });
}
```
