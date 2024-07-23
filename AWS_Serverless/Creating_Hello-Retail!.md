# Creatin Hello-Retail!        
          
참고한 git은 [https://github.com/SimonEismann/hello-retail/tree/master](https://github.com/SimonEismann/hello-retail/tree/master)입니다.    
이 git을 토대로 만든 코드들을 제 git에 올려놨습니다. [https://github.com/shinchanghee/hello-retail-shin.git](https://github.com/shinchanghee/hello-retail-shin.git)
            
---    
    
## 제작과정   
### 기본 환경 설정       
     
serverless.yml에서 사용하는 node의 버전 : 최소 20.x
Serverless Framework의 버전 : 4.x 이상(최신 버전)
Node Version : 22.x     
       
---      
      
### aws 계정 생성      
실습을 위해 IAM 계정을 새로 하나 만들어줍니다. Role은 AdministratorAccess을 부여해서 생성하였습니다.    
Access Key를 Application running on an AWS compute service를 선택해서 생성합니다.      
    
---    
      
### 코드 수정     
#### 공통       
모든 serverless.yml의 코드에서 provider.runtime을 모두 nodejs20.x로 변경, region도 생성한 IAM과 맞게 설정, stage는 dev로 통일 했습니다.
{self:}를 사용할 수 없었기에, self라는 단어는 모두 지워주고, 하드 코딩을 하거나, 경로를 따오는 방법을 사용해줍니다. 
#### Dockerfile     
이 실습을 컨테이너 환경에서 실행했기 때문에 Dockerfile의 수정이 필요했습니다. 기본적인 환경 셋팅을 위해 nodejs와 awscli 설치하는 부분을 수정했습니다.      
```bash
RUN curl -sL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean
RUN curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip" && \
    unzip awscliv2.zip && \
    ./aws/install
```               
ubuntu의 version도 최신으로 바꿔주고, RUN apt-get update --yes && 에 unzip을 추가해줍니다. 그리고, 수정한 코드를 사용하기 위해 RUN git clone도 수정한 코드가 담긴 저의 git을 clone 받아 사용했습니다.      
     
---     
       
#### private.yml       
자신의 Account Id와 Region을 참고해 빈칸을 채워주면 됩니다.   
```bash
region: ap-northeast-2
company: cclab
team: cclab
stage: dev
domainName: hello-retail-590183717745.biz
```    
---   
     
### helloRetail.yml      
private.yml의 정보를 참고해 하드코딩해주었습니다. 
```bash  
name: hello-retail
deploymentBucket: com.cclab.cclab.serverless.ap-northeast-2
```    
         
---    
    
### build     
#### 2.sls.sh        
serverless 명령어의 경로에 맞춰서 ${OWD}/node_modules/.bin/sls 이런 식으로 바꿔줘야합니다.    
    
---     
     
### retail-stream    
self사용이 안 되기때문에 custom부분은 하드 코딩을 해줍니다. 
나머지 부분은 해당 경로에 맞게 하드 코딩을 해주거나, ${custom.*}를 이용해 변수를 할당해줍니다.   
     
---     
     
### event-writer     
마찬가지로 self 사용이 안 되기때문에 경로에 맞춰서 하드코딩을 해주거나, ${custom.*}을 해주었습니다.
그리고 aws-sdk를  npm install aws-sdk 혹은 package.json 파일에 포함시켜 설치해주어야합니다.   
그리고 Outputs.EventWriterRestApi.Value는 자신의 api를 작성해주시면 됩니다. ex) invoke URL : http://{api}.execute-api.ap-northeast-2.amazonaws.com/dev 여기서 api에 해당하는 부분을 써주시면 됩니다. 그리고 POST 요청이 들어오면 해당하는 Category나 Product에 저장될 수 있게 코드를 추가했습니다.    
      
---     
      
### product-catalog      
#### api           
serverless.yml에서는 경로에 맞춰서 하드 코딩을 해주거나 self를 없애면 됩니다. 
그리고 Outputs.ProductCatalogApi.Value는 자신의 api를 작성해주시면 됩니다. ex) invoke URL : http://{api}.execute-api.ap-northeast-2.amazonaws.com/dev 여기서 api에 해당하는 부분을 써주시면 됩니다. 
#### builder     
serverless.yml에서는 위처럼 하드 코딩을 하거나 self 키워드를 없애줍니다. 
     
---     
     
### product-photos          
#### 0.processor        
serverless.yml 파일만 경로에 맞춰서 하드 코딩하거나 ${custom.*}을 이용하면 됩니다. 그리고 ${AWS::}를 지원하지 않기 때문에 arn:aws:로 대체해서 사용합니다. 그리고 kinesis를 사용하지 않기때문에, step function의 execution 조건을 S3의 변화가 생겼을 때로 바꿔줍니다. 즉 사용자가 등록했을 때 이벤트가 발생할 수 있게 바꿔줍니다.
#### 1.assign       
serverless.yml 파일만 경로에 맞춰서 하드 코딩하거나 ${custom.*}을 이용하면 됩니다. 그리고 ${AWS::}를 지원하지 않기 때문에 arn:aws:로 대체해서 사용합니다.
#### 2.receive 
serverless.yml 파일만 경로에 맞춰서 하드 코딩하거나 ${custom.*}을 이용하면 됩니다.
그리고 Endpoint를 자신의 region에 맞춰서 수정해주시면 됩니다.
#### 3.fail, 4. report, data, process, productPhotos.yml     
serverless.yml 파일만 경로에 맞춰서 하드 코딩하거나 ${custom.*}을 이용하면 됩니다. 그리고 ${AWS::}를 지원하지 않기 때문에 arn:aws:로 대체해서 사용합니다. 그리고 경로 설정시에 앞에 ./ 붙여야 하는 것 주의해야합니다. 그리고 kinesis를 사용하지 않고, S3의 이벤트를 사용했기 때문에 kinesis에 대한 코드는 모두 지우거나, S3로 바꿔줍니다. 그리고 모든 package.json의 dependencies에 "aws-sdk": "^2.1659.0"를 추가해줘야합니다. 

---
      
### web     
#### serverless.yml          
우선 경로 설정부터 올바르게 해야합니다. plugin의 경로 앞에 ./를 붙여주고, resources.Conditions.ProductionStage는 자신의 stage를 'prod'
 대신 써주시면 됩니다. 그리고 S3에 관한 에러가 발생할 수 있기때문에 IAM 권한에 AmazonS3FullAccess를 추가해줍니다. 그리고 만들어진 Bucket hello-retail.biz에 대해 권한을 허용해주어야합니다. 허용하고 다시 deploy하면 잘 되는 모습을 볼 수 있습니다.

 ### 배포     
 본문에 주어진 docker exec -it hello-retail bash /hello-retail/runner.sh를 통해 runner.sh를 실행하면 삭제까지 이뤄지기 때문에, 
 ```bash
 npm run root:install:all
 npm run root:deploy:all
 npm run web:install
 npm run web:deploy:all
 npm run web:dev:hot
 ```
 을 통해 배포후에 웹을 hello-retail을 띄울 수 있습니다.
 <img src="img/Hello-retail/front.png"></src>
 

 ### 참고사항
Product-Photos에 대한 lambda를 실행 시킬때는 API를 호출할 프론트 코드가 없기 때문에 Lambda 콘솔창에서 test를 이용해서 확인했습니다. 
 
