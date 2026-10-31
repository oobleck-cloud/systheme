/**
 * 포인터 종류 — 호버 의도(hover intent)는 마우스에서만 참이다.
 *
 * ## 왜 필요한가
 *
 * 터치로 한 번 탭하면 브라우저는 `pointerover/pointerenter` 를 먼저 보내고 곧이어 `click` 을
 * 보낸다(호환을 위해 `mouseenter` 도 흉내 낸다). 그래서 "enter 로 열고 click 으로 토글" 하는
 * UI 는 손가락으로 **열렸다가 그 자리에서 닫힌다** — 아무 일도 일어나지 않은 것처럼 보인다.
 * 접힌 사이드바의 3-depth 서브메뉴가 모바일에서 열리지 않던 것이 정확히 이 문제였다.
 * 반대로 `pointerleave` 는 손을 떼도 오지 않아, 닫기를 leave 에 걸어 두면 영영 닫히지 않는다.
 *
 * ## 왜 미디어 쿼리가 아니라 이벤트에 묻는가
 *
 * `(hover: none)` 은 **기기**의 성질이고, 우리가 알아야 하는 것은 **지금 이 동작**의 성질이다.
 * 터치스크린 노트북처럼 둘 다 있는 기기에서는 기기를 물어봐야 답이 하나로 고정돼 틀린다.
 * 이벤트는 매번 자기가 마우스인지 손가락인지 알고 있다.
 *
 * ## 쓰는 법
 *
 * hover 로 여닫는 핸들러의 첫 줄에 둔다. 터치에서는 click 이 상태를 온전히 갖게 되고,
 * 마우스에서는 지금까지와 똑같이 동작한다.
 *
 * ```tsx
 * onPointerEnter={(e) => { if (isMousePointer(e)) open() }}
 * onPointerLeave={(e) => { if (!isMousePointer(e)) return; close() }}
 * ```
 *
 * 펜(`pen`)은 마우스로 치지 않는다 — 스타일러스는 화면에 닿아야 위치가 정해지므로
 * 터치와 같은 순서로 이벤트가 온다.
 */
export function isMousePointer(event: { pointerType?: string }): boolean {
  return event.pointerType === 'mouse'
}
