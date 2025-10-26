1. 사용자가 분석 요청을 할 때, 실제 LLM에 분석 요청하기 전에 supabase의 stock_analyses 테이블에 아래와 같은 조건의 데이터가 있으면, LLM에 요청하지 말고, supabase에 있는 데이터를 리턴해서 분석결과에 뿌려줘
    - 조건
        - market, symbol, name, compare_periods, model이 같은 데이터이면서
        - 현재일시가 created_at 보다 7일 이전인 데이터
2. analyses_history 테이블 생성해줘
    - 컬럼: users 테이블의 id, stock_analyses 테이블의 id, created_at, updated_at
3. 사용자가 분석 요청을 하면 (LLM분석 요청 및 Supabse에 존재하는 데이터 조회 모든 케이스), analyses_history에 분석 요청한 데이터를 쌓아줘
4. '내정보' 화면에 사용자의 analyses_history에 쌓인 데이터를 표 형태로 보여줘 (로그인한 user_id에 해당되는 값만 표시)
    - 표 컬럼: stock_analysese(market, symbol, name), analyses_history(created_at), 리포트 버튼
    - 표 컬럼의 리포트 버튼을 누르면 해당 분석 리포트 결과 화면을 보여줘
        
위 요구사항을 만족하기 위해 필요한 작업 리스트를 todo-251025.md 파일에 정리해줘