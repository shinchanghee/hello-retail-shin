# Serverless Computing
Serverless는 FaaS로 자동 스케일링이 가능합니다.
Serverless Computing은 클라우드 제공업체에서 가상 머신 프로비저닝, dnsudd 체제 패치 및 업그레이드, 분산 및 요청의 자동확장을 책임지기 때문에 사용자가 자체 소프트웨어 스택을 관리해야 하는 부담을 벗어나게 해줍니다. 
Serverless는 사용한 만큼만 값을 지불하는 pay-per-use를 채택하고 있습니다. 
Serverless는 개발자가 높은 수준의 작업을 수행하는 워크플로우로 연결되는 재진입 함수를 통해 애플리케이션의 신속한 프로토타이핑이 가능하게 해줍니다.
플랫폼을 보호하기 위해서 함수는 독립된 컨테이너에서 실행돼야 합니다. 

# Attacks on Serverless
함수의 짧은 생존 시간에도 불구하고 공격이 있다.
## Exploiting Container Reuse
warm containers라는 미리 구성된 시간 내에 사용한 함수를 저장해뒀다가, 호출할 때 재사용합니다. Attacker는 malware나 악성 툴킷을 작성 후 warm container를 악용해 악성 인스턴스가 캐시에 남아있도록 합니다. 불투명한 플랫폼 정책과 스케줄링 알고리즘으로 인해 사용자가 이런 문제를 고려하기 어렵다.
## Exfiltration through Function Workflows
Workflow를 통해서 데이터 유출이 가능합니다. 네트워크 엑세스에 제한을 두어도, Attacker들은 다운 스트림 인증 함수 및 합법적인 플랫폼 API를 이용해 훔친 데이터를 세탁해서 유출합니다. 합법적인 기능 전환을 이용해 어플리케이션을 수평적으로 이동할 수 있습니다. 이를 위해 접근 제어 정책의 복잡성을 높이다가, 잘못된 구성이 발생할 확률이 높아져 Attacker에겐 더 큰 기회가 될 수 있습니다.
## third party functions
써드 파티 함수(Serverless 환경에서 사용되는 서비스 및 외부함수)가 많기 때문에 Serverless Application은 악의적인 코드에 노출될 수 있습니다.
# Limitations of Existing Approaches
Data provenance techniques은 의심되는 이벤트부터 역추적하여 근본 원인 분석에 사용됩니다. 또한 포워드 추척 쿼리(네트워크 트래픽이나 시스템 로그 데이터 추적)는 공격의 결과를 이해하는데 도움이 됩니다. 그렇기에 provenance graphs는 공격에 유용할 것 입니다. 하지만 이는 단일 시스템 내부에서 발생하는 이벤트에 국한되는 방면, Severless platform에서의 공격은 분산 추적 및 감사 매커니즘을 필요로 합니다. 아직 특화된 감사 프레임워크는 등장하지 않았지만, Serverless platform에 대한 공격 증거를 이용해 Serverless Application에 대한 런타임 가시성을 개선하는 다양한 tools가 생겼습니다. 하지만 제한 받거나 특정 언어 런라임이나 platform에 제한됩니다. 보호를 위해서는 분산 추적을 제공해야 합니다. 하지만 이를 만족시에는 시스템 수준의 상호 작용을 설명하지 않기 때문에 공격 진단이나 조사에는 맞지 않다고 볼 수 있습니다. 또한 이 tools은 컨테이너 내 상호작용을 고려하지 않습니다.

![image](img/Serverless_Architecture_with_Hello_Retail.png)
