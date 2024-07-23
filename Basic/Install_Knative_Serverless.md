## Environment Setting
cpu 10, Ram 12G, Hard Disk 40G

## Before Install
설치 전 다양한 에러가 발생할 수 있는데 제가 발생했던 에러에 대한 대처법을 적어놓겠습니다.   
1. Docker pull limit    
```bash
echo '[plugins."io.containerd.grpc.v1.cri".registry.configs."registry-1.docker.io".auth]' >> /etc/containerd/config.toml
echo '  username = "dockerhub ID"' >> /etc/containerd/config.toml
echo '  password = "dockerhub PW"' >> /etc/containerd/config.toml
systemctl restart containerd
``` 
2. Ram 오류 
istio 설치 시 Ram 사용량이 8.5G까지 늘기때문에 꼭 설치 시 Ram을 넉넉히 설치해야합니다.

## Install Knative Serverless
### Install cosign and jq
이미지를 검증하기 위한 명령어와 json파일에 접근하기 위한 명령어를 설치합니다.
```bash
curl -O -L "https://github.com/sigstore/cosign/releases/latest/download/cosign-linux-amd64"
sudo mv cosign-linux-amd64 /usr/local/bin/cosign
sudo chmod +x /usr/local/bin/cosign
sudo apt-get install jq
```

### Verifing image signature
설치하기 전 설치할 파일을 검증하는 명령어   
```bash
curl -sSL https://github.com/knative/serving/releases/download/knative-v1.14.0/serving-core.yaml \
  | grep 'gcr.io/' | awk '{print $2}' | sort | uniq \
  | xargs -n 1 \
    cosign verify -o text \
      --certificate-identity=signer@knative-releases.iam.gserviceaccount.com \
      --certificate-oidc-issuer=https://accounts.google.com
```

### Install Knative-Serving
Knative-Serviing 환경을 설치합니다.   
주요 기능으로 트래픽이 들어오면 어느 컨테이너를 파드로 실행시킬지 정해주는 라우트,   
컨테이너 실행 전 수정이 일어날시 적용 및 배포를 해주는 Configuration,
컨테이너를 향하는 경로를 지정해주는 Revision, 이러한 환경들을 미리 구성한다.
```bash
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.14.0/serving-crds.yaml
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.14.0/serving-core.yaml
```

### Install a network layer
network환경으로 istio를 사용하기위해 istio를 설치합니다.   
이때 오류가 발생한다면 처음에 쓴 Docker pull limit이나 Ram 사용량을 확인해봐야합니다.   
```bash
curl -L https://istio.io/downloadIstio | sh -
cd istio-1.22.0
export PATH=$PWD/bin:$PATH
istioctl install -y
kubectl apply -f https://github.com/knative/net-istio/releases/download/knative-v1.14.0/net-istio.yaml
kubectl label namespace knative-serving istio-injection=enabled
```
서비스 간 통신을 선택적으로 하기위해 TLS은 요구하지 않게 설정합니다.   
Creating yaml file using following template:   
```bash
apiVersion: "security.istio.io/v1beta1"
kind: "PeerAuthentication"
metadata:
  name: "default"
  namespace: "knative-serving"
spec:
  mtls:
    mode: PERMISSIVE
```

Apply the yaml file   
```bash
kubectl apply -f <filename>.yaml
```

istio와 knative-serving이 잘 연동됐는지 확인하는 명령어   

```bash
istioctl verify-install
```

### Configure DNS
IP와 Port번호를 사용하기 위해 DNS를 설정하지 않고 patch를 실행합니다.   
```bash
kubectl patch configmap/config-domain \
      --namespace knative-serving \
      --type merge \
      --patch '{"data":{"example.com":""}}'
```

### Install optional Serving extensions
autoscaling
```bash
kubectl apply -f https://github.com/knative/serving/releases/download/knative-v1.14.0/serving-hpa.yaml
```

### Install Eventing
```bash
kubectl apply -f https://github.com/knative/eventing/releases/download/knative-v1.14.1/eventing-crds.yaml
kubectl apply -f https://github.com/knative/eventing/releases/download/knative-v1.14.1/eventing-core.yaml
```

## Example(Helloworld-python)
```bash
git clone https://github.com/knative/docs.git knative-docs
cd knative-docs/code-samples/serving/hello-world/helloworld-python
mkdir app
cd app
```
Create a file name "app.py" and copy the following code:   
```bash
import os

from flask import Flask

app = Flask(__name__)

@app.route('/')
def hello_world():
   target = os.environ.get('TARGET', 'World')
   return 'Hello {}!\n'.format(target)

if __name__ == "__main__":
   app.run(debug=True,host='0.0.0.0',port=int(os.environ.get('PORT', 8080)))
```

Docker build and push          
```bash
sudo docker login
cd ..
sudo docker build -t {username}/helloworld-python .
sudo docker push {username}/helloworld-python
```

Create a yaml file, service.yaml and copy following code:   
```bash
  apiVersion: serving.knative.dev/v1
  kind: Service
  metadata:
    name: helloworld-python
    namespace: default
  spec:
    template:
      spec:
        containers:
          - image: docker.io/{username}/helloworld-python
            env:
              - name: TARGET
                value: "Python Sample v1"
```

Apply service.yaml file using kubectl and watch URL and Port number
```bash
kubectl apply -f service.yaml
kubectl get ksvc
kubectl get svc istio-ingressgateway -n istio-system
```

Make a request
```bash
curl -H "Host: {URL}" http://{your_ip}:{Port}
```


### Example
실행 시키기 전 url과 Port 번호 확인 및 실행중인 Pod가 없는 것을 볼 수 있다.   
<img src="img/helloworld_py_before.png"></img>
요청을 보내면 응답이 잘 오는 것도 볼 수 있고 파드도 생성이 된다. 그리고 1분정도 후에 다시 확인해보면 파드가 종료된 것을 볼 수 있다.   
<img src="img/helloworld_py_after.png"></img>

## Deploy On Web
istio-ingressgateway를 NodePort로 바꿔도, 웹에서는 접근할 수 없는 에러가 있습니다.   
Port번호를 알아도, 호스트의 정보가 명확하지 않기때문입니다. 그렇기 때문에 도메인을 하나 갖고 있어야 합니다.    
저는 Duck DNS를 이용해서 해보도록 하겠습니다.    
참고 링크 : [https://gruuuuu.github.io/cloud/loadbalancer/](https://gruuuuu.github.io/cloud/loadbalancer/)   
- 우선 Duck DNS에 들어가 로그인을 합니다.
- current IP값에는 vm의 ip번호를 넣고, sub domain에는 원하는 주소를 넣고 add domain을 통해 도메인을 생성합니다.
- install 메뉴에 들어가서 자신이 만든 도메인을 선택한 후, 환경을 선택하면 설치하는 방법이 나타나는데, 그대로 따라하면 됩니다.
- nslookup <domain>명령어를 통해 Address에 설정한 IP값이 뜨면 성공입니다.

다음으론 nginx 설치 후 Web에 띄어지는 지 확인하는 과정입니다.
```bash
sudo apt install nginx              
systemctl enable nginx  
systemctl start nginx 
```
후에 만든 도메인에 접속해보면 nginx기본 화면이 뜨게됩니다.    
다음으로 포트 포워딩을 진행해보겠습니다.    
```bash
sudo vim /etc/nginx/sites-enable 
# proxy_pass http://{ip address}:{Port Num}
# proxy_set_header Host $host;
# proxy_http_version 1.1;
# proxy_set_header Upgrade $http_upgrade;
# proxy_set_header Connection "upgrade";
# 위 코드 들을 server { location { 여기에 넣습니다. } }
sudo systemctl restart nginx 
kubectl patch configmap/config-domain   --namespace knative-serving   --type merge   --patch '{"data":{"<domain>":""}}'      
```
이 다음 curl로 확인해보면 잘 작동되는 모습을 볼 수 있습니다. 
<img src="img/web_curl.png"></img> 
curl이 도메인으로도 잘 작동하는 모습입니다.    
<img src="img/web_curl2.png"></img> 
domain이 정상적으로 작동하는 모습입니다.   
<img src="img/web_curl_svs.png"></img>
파드가 일정시간 후 종료되는 모습입니다.    
    

    
