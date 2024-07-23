# VM
Monolothioc Application은 [Prestashop](https://github.com/PrestaShop/PrestaShop?tab=readme-ov-file)을 참고해서 만들었습니다.

설치 방법   
```Bash   
sudo apt update   
sudo apt install apache2 -y   
sudo systemctl status apache2.service   
sudo apt install mysql-server -y   
sudo systemctl start mysql   
sudo systemctl enable mysql   
sudo mysql_secure_installation #모두 Y, Policy = 2로 설정   
sudo apt install php libapache2-mod-php php-mysql -y   
cd /var/www/html   
sudo wget https://github.com/PrestaShop/PrestaShop/releases/download/8.1.5/prestashop_8.1.5.zip   
sudo unzip prestashop_8.1.5.zip -d prestashop
```
Monolothic Application Architecture
<img src="img/VM.png"></img>   


# Container
Container Application은 [Online Boutique](https://github.com/GoogleCloudPlatform/microservices-demo)를 참고해서 만들었습니다.

설치 방법   
``` Bash   
sudo git clone https://github.com/GoogleCloudPlatform/microservices-demo.git   
cd microservices-demo   
kubectl apply -f ./release/kubernetes-manifests.yaml
```
Container Application Architecture
<img src="img/Container.png"></img>    
   
# Serverless
Serverless는 [Saleor](https://github.com/saleor)을 참고해서 만들고 있습니다.
아직 함수, 기능 단계가 아닌 git에서 제공하는 컨테이너로 띄울 때 사용하는 이미지를 이용해서 serverless로 변형하여 사용했습니다.
### saleor이미지 -> saleor-api.yaml
``` Bash
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: saleor-api
  namespace: default
spec:
  template:
    spec:
      containers:
        - image: docker.io/changhee9149/saleor-api
          name: saleor-api
          command: ["/bin/sh", "-c"]
          args:
            - |
              python3 manage.py migrate &&
              gunicorn --bind 0.0.0.0:8000 --workers 4 --worker-class saleor.asgi.gunicorn_worker.UvicornWorker saleor.asgi:application
          ports:
            - containerPort: 8000
          env:
            - name: DATABASE_URL
              value: "postgres://saleor:saleor@postgresql.default.svc.cluster.local:5432/saleor"
            - name: REDIS_URL
              value: "redis://redis.default.svc.cluster.local:6379/0"
            - name: SECRET_KEY
              value: "changhee"
            - name: ALLOWED_HOSTS
              value: "saleor-api.default.cclabshin.duckdns.org,saleor-dashboard.default.cclabshin.duckdns.org,.example.com"
            - name: JAEGER_AGENT_HOST
              value: "jaeger"
            - name: DASHBOARD_URL
              value: "http://saleor-dashboard.default.cclabshin.duckdns.org/"
```

### saleor-dashboard 이미지 -> saleor-dashboard.yaml
``` Bash
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: saleor-dashboard
  namespace: default
spec:
  template:
    spec:
      containers:
        - image: docker.io/changhee9149/saleor-dashboard
          ports:
            - containerPort: 80
          env:
            - name: API_URL
              value: "http://saleor-api.default.cclabshin.duckdns.org/graphql/"
            - name: ALLOWED_HOSTS
              value: "saleor-dashboard.default.cclabshin.duckdns.org,.example.com"
            - name: MEDIA_URL
              value: "/media/"
            - name: ENABLE_SSL
              value: "True"
```
### saleor-api 웹 페이지 
<img src="img/saleor_api.png"></img>
생성시 보이는 pod의 생성과 종료
<img src="img/saleor_api_run.png"></img>

### saleor-dashboard 웹 페이지
<img src="img/saleor_dashboard.png"></img>
생성시 보이는 pod의 생성과 종료
<img src="img/saleor_dashboard_run.png"></img>

Serverless Application Architecture    
<img src="img/Serverless.png"></img>     
   
# VM vs Container vs Serverless
VM에서 설치한 방법은 Container를 사용하지 않았지만, 비교를 위해서 컨테이너를 이용했을 때의 Architecture를 그렸습니다.   
VM에서는 하나의 컨테이너 위에 하나의 단일 Application이 올라가게 됩니다. 이 예시에서는 PHP, Apache2, MySQL이 사용됩니다.     
Container에서는 Application의 기능이 여러개의 파드들로 나누어지게 됩니다. 예시에서는 Frontend 화면 기능, Cart 장바구니 기능, Payment 계산 기능등 여러 기능을 부분화 하여서 구현하였습니다.   
Serverless에서는 Application의 기능이 함수의 형태로 저장되게 됩니다. Knative의 경우 3가지의 기본 기능이 있어야합니다다. Build, Serve, Event가 있습니다. Build는 소스코드를 컨테이너화 해주고, Serve는 Event가 발생했을 때 Route기능, 컨테이너가 만들어졌을때 경로를 설정해주는 기능등이 있고, Event는 event source에 담긴 event가 발생했을 때 service에 message를 보내 해당 함수가 실행될 수 있게 해줍니다. 우리가 함수를 만들면, Build가 컨테이너화 해서 저장해주고, 그 컨테이너의 경로를 Serve가 지정해주고, 해당 함수가 호출되는 상황에 Event가 Serve에게 신호를 보내 해당 함수가 실행될 수 있게 해주는 흐름으로 이루어지게 됩니다. 본 예시에서의 기능은 크게 네 가지, 구매 부분, 상품 안내, 상품 사진, 이벤트로 나누어져 있고, 이 안에서 여러개의 함수로 이루어져 있습니다. 예를 들면 구매 부분에선 상품의 가격을 얻는 함수, 상품 구매 정보를 얻는 함수 등이 있습니다.





