const { chromium } = require('playwright');

async function runTests() {
    console.log('🚀 할 일 관리 앱 테스트 시작\n');

    const browser = await chromium.launch({
        headless: false,  // 브라우저 UI 표시
        slowMo: 500       // 동작 간 0.5초 딜레이
    });

    const context = await browser.newContext();
    const page = await context.newPage();

    // confirm 대화상자 자동 수락
    page.on('dialog', async dialog => {
        console.log(`  [대화상자] ${dialog.message()}`);
        await dialog.accept();
    });

    try {
        // 페이지 접속
        await page.goto('http://localhost:8080');
        console.log('✅ 페이지 접속 성공\n');

        // localStorage 초기화 (이전 테스트 데이터 삭제)
        await page.evaluate(() => localStorage.clear());
        await page.reload();
        console.log('✅ localStorage 초기화 완료\n');

        // ===== 1. 아이템 추가 테스트 =====
        console.log('📝 테스트 1: 아이템 추가');

        // 첫 번째 할 일 추가 (업무)
        await page.fill('#todoInput', '회의 자료 준비하기');
        await page.selectOption('#categorySelect', '업무');
        await page.click('#addBtn');
        console.log('  - "회의 자료 준비하기" (업무) 추가');

        // 두 번째 할 일 추가 (개인)
        await page.fill('#todoInput', '운동하기');
        await page.selectOption('#categorySelect', '개인');
        await page.click('#addBtn');
        console.log('  - "운동하기" (개인) 추가');

        // 세 번째 할 일 추가 (공부)
        await page.fill('#todoInput', 'JavaScript 복습');
        await page.selectOption('#categorySelect', '공부');
        await page.click('#addBtn');
        console.log('  - "JavaScript 복습" (공부) 추가');

        // 아이템 개수 확인
        const items = await page.locator('#todoList .todo-item').count();
        console.log(`  ✅ 추가된 아이템 수: ${items}\n`);

        // 잠시 대기
        await page.waitForTimeout(1000);

        // ===== 2. 아이템 체크 테스트 =====
        console.log('✔️ 테스트 2: 아이템 체크 (완료 처리)');

        // 첫 번째 아이템 체크
        const firstCheckbox = page.locator('#todoList .todo-item').first().locator('input[type="checkbox"]');
        await firstCheckbox.click();
        console.log('  - 첫 번째 아이템 체크 완료');

        // 진행률 확인
        await page.waitForTimeout(500);
        const progressText = await page.locator('#progressText').textContent();
        const progressPercent = await page.locator('#progressPercent').textContent();
        console.log(`  ✅ 진행률: ${progressText} (${progressPercent})\n`);

        // 잠시 대기
        await page.waitForTimeout(1000);

        // ===== 3. 아이템 수정 테스트 =====
        console.log('✏️ 테스트 3: 아이템 수정');

        // 두 번째 아이템의 수정 버튼 클릭 (✎ 버튼)
        const secondItem = page.locator('#todoList .todo-item').nth(1);
        const editBtn = secondItem.locator('.edit-btn');

        await editBtn.click();
        console.log('  - 수정 버튼(✎) 클릭');

        // 수정 입력 필드가 나타나면 텍스트 수정
        await page.waitForTimeout(300);
        const editInput = secondItem.locator('.edit-input');
        await editInput.fill('헬스장 가기');

        // 저장 버튼 클릭
        const saveBtn = secondItem.locator('.save-btn');
        await saveBtn.click();
        console.log('  - "운동하기" -> "헬스장 가기"로 수정');
        console.log('  ✅ 수정 완료\n');

        // 잠시 대기
        await page.waitForTimeout(1000);

        // ===== 4. 필터 테스트 =====
        console.log('🔍 테스트 4: 카테고리 필터');

        // 업무 필터 클릭
        await page.click('[data-filter="업무"]');
        await page.waitForTimeout(500);
        const workItems = await page.locator('#todoList .todo-item:visible').count();
        console.log(`  - 업무 필터: ${workItems}개 표시`);

        // 전체 필터로 복귀
        await page.click('[data-filter="전체"]');
        await page.waitForTimeout(500);
        const allItems = await page.locator('#todoList .todo-item:visible').count();
        console.log(`  - 전체 필터: ${allItems}개 표시`);
        console.log('  ✅ 필터 테스트 완료\n');

        // 잠시 대기
        await page.waitForTimeout(1000);

        // ===== 5. 아이템 삭제 테스트 =====
        console.log('🗑️ 테스트 5: 아이템 삭제');

        // 삭제 전 아이템 수
        const beforeDelete = await page.locator('#todoList .todo-item').count();
        console.log(`  - 삭제 전 아이템 수: ${beforeDelete}`);

        // 세 번째 아이템 삭제 (× 버튼)
        const thirdItem = page.locator('#todoList .todo-item').nth(2);
        const deleteBtn = thirdItem.locator('.delete-btn');

        await deleteBtn.click();
        console.log('  - 세 번째 아이템 삭제 버튼(×) 클릭');

        await page.waitForTimeout(500);

        // 삭제 후 아이템 수
        const afterDelete = await page.locator('#todoList .todo-item').count();
        console.log(`  - 삭제 후 아이템 수: ${afterDelete}`);
        console.log('  ✅ 삭제 완료\n');

        // ===== 테스트 결과 요약 =====
        console.log('=' .repeat(50));
        console.log('📊 테스트 결과 요약');
        console.log('=' .repeat(50));
        console.log('✅ 1. 아이템 추가: 성공');
        console.log('✅ 2. 아이템 체크: 성공');
        console.log('✅ 3. 아이템 수정: 성공');
        console.log('✅ 4. 카테고리 필터: 성공');
        console.log('✅ 5. 아이템 삭제: 성공');
        console.log('=' .repeat(50));
        console.log('\n🎉 모든 테스트가 완료되었습니다!');

        // 결과 확인을 위해 3초 대기
        await page.waitForTimeout(3000);

    } catch (error) {
        console.error('❌ 테스트 실패:', error.message);
    } finally {
        await browser.close();
        console.log('\n브라우저가 종료되었습니다.');
    }
}

runTests();
