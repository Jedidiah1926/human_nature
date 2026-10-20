'use strict';

// ===== 언어 =====
const I18N = {
    ko: {
        tagline: '세계 의회 · 지구인 누구나 의원',
        tab_chamber: '의회', tab_parties: '정당', tab_agendas: '의제', tab_login: '입장', lang: 'EN',
        seats: '석', SEATS: 'SEATS', members: '재적 의원', parties: '정당', open_agendas: '진행 중 의제',
        independent: '무소속', majority: '과반', majority_line: (n) => `과반 의석: ${n}석`,
        no_members: '아직 의원이 없습니다. 첫 의원이 되어 보세요!',
        composition: '의석 구성',
        join_cta: '입장하여 의원 되기',
        // 정당
        create_party: '+ 정당 창당', edit_party: '정당 수정', join: '입당', leave: '탈당', leader: '대표',
        your_party: '내 정당', no_parties: '아직 정당이 없습니다. 첫 정당을 만들어 보세요.',
        party_name: '정당 이름', party_abbr: '약칭 (선택)', party_color: '정당 색', ideology: '이념 성향',
        left: '좌파', centre: '중도', right: '우파', description: '소개 / 강령',
        community: '당 커뮤니티 (당 게시판 대신 쓰는 외부 링크)',
        link_discord: 'Discord 서버', link_reddit: 'Reddit (subreddit)', link_dcinside: '디시인사이드 갤러리', link_other: '기타 링크',
        save: '저장', cancel: '취소', create: '만들기', transfer_leader: '대표 넘기기', transfer: '넘기기',
        member_list: (n) => `당원 ${n}명`,
        details: '자세히', back_parties: '← 정당 목록', member_role: '평당원', roles: '직책 · 서열', add_role: '+ 직책 추가',
        role_name: '직책 이름', role_placeholder: '예: 부대표, 원내대표, 사무총장, 대변인', perms: '권한', all_perms: '모든 권한', no_perms: '권한 없음',
        role_perms_hint: '자기가 가진 권한만 줄 수 있고, 자기보다 낮은 직책·당원만 다룰 수 있습니다.',
        rank_hint: '위에 있을수록 서열이 높습니다. 누구든 자기보다 낮은 서열만 다룰 수 있습니다.',
        edit: '수정', delete: '삭제', kick: '제명', confirm_kick: (n) => `${n} 의원을 제명할까요? 24시간 동안 다시 입당할 수 없습니다.`,
        confirm_role_delete: (n) => `「${n}」 직책을 없앨까요? 이 직책의 당원은 평당원이 됩니다.`,
        perm_edit_info: '정당 정보 수정', perm_edit_info_desc: '이름 · 색 · 이념 · 강령 · 커뮤니티 링크',
        perm_announce: '공지 작성', perm_announce_desc: '당 공지를 쓰고 고칩니다',
        perm_approve_join: '입당 승인', perm_approve_join_desc: '입당 신청 승인·거절, 입당 방식 변경',
        perm_manage_members: '당원 제명', perm_manage_members_desc: '자기보다 서열이 낮은 당원을 제명 (24시간 재입당 금지)',
        perm_manage_roles: '직책 관리 · 임명', perm_manage_roles_desc: '자기보다 낮은 직책을 만들고 고치고, 당원을 임명·해임',
        perm_set_whip: '당론 지정', perm_set_whip_desc: '의제마다 당의 공식 입장(찬성·반대·기권)을 정합니다',
        delegate: '대표 위임', new_leader: '새 대표', after_role: '위임 후 내 직책',
        delegate_desc: '대표 자리를 다른 당원에게 직접 넘깁니다. 넘긴 뒤에는 되돌릴 수 없고, 새 대표가 다시 위임해야 합니다.',
        confirm_delegate: (n) => `「${n}」 의원에게 대표를 위임할까요?`,
        notice: '당 공지', edit_notice: '공지 수정', no_notice: '공지가 없습니다.',
        join_policy: '입당 방식', policy_open: '자유 입당', policy_approval: '승인제', requests: '입당 신청',
        no_requests: '대기 중인 신청이 없습니다.', approve: '승인', reject: '거절',
        request_join: '입당 신청', cancel_request: '신청 취소', requested: '입당을 신청했습니다', pending: '승인 대기',
        whip: '당론', free_vote: '자유 투표', defections: '이탈', my_whip: '우리 당 당론', set_whip: '당론 지정',
        confirm_leave: '정말 탈당하시겠습니까? 마지막 당원이면 정당이 해산됩니다.',
        confirm_switch: (name) => `현재 정당을 떠나 「${name}」에 입당합니다. 계속할까요?`,
        confirm_create_switch: '새 정당을 만들면 지금 정당에서 탈당합니다. 계속할까요?',
        joined: '입당했습니다', left_party: '탈당했습니다', created_party: '창당했습니다', saved: '저장했습니다',
        // 의제
        new_agenda: '+ 의제 발의', agenda_title: '제목', agenda_body: '내용', duration: '표결 기간',
        hours: (h) => h < 24 ? `${h}시간` : `${h / 24}일`, propose: '발의',
        open: '표결 중', passed: '가결', rejected: '부결', withdrawn: '철회됨',
        yea: '찬성', nay: '반대', abs: '기권', not_voted: '미투표',
        remaining: (s) => `남은 시간 ${s}`, closed_at: (s) => `${s} 마감`,
        by: (n) => `발의: ${n}`, your_vote: '내 표', change_vote: '마감 전까지 표를 바꿀 수 있습니다.',
        login_to_vote: '표결하려면 입장하세요.', withdraw: '발의 철회', confirm_withdraw: '이 의제를 철회할까요?',
        no_agendas: '아직 의제가 없습니다.', by_party: '정당별 표결', back: '← 의제 목록',
        result_rule: (q) => q > 0 ? `찬성이 반대보다 많고 투표율 ${Math.round(q * 100)}% 이상이면 가결` : '찬성이 반대보다 많으면 가결',
        turnout: '투표율', proposed_toast: '발의했습니다 — 이제 추천을 모으세요', voted: '투표했습니다',
        // 법안 흐름
        proposed: '추천 단계', expired: '폐기', sec_open: '🗳️ 본회의 표결 중', sec_proposed: '📑 추천 단계', sec_past: '지난 의제',
        flow_hint: (n, d) => `발의 → 추천 ${n}표 이상(비추천보다 많아야) 모이면 본회의 상정 → 표결. ${d}일 안에 못 모으면 폐기.`,
        sponsors: (n, need) => `추천 ${n} / ${need}`, opposers: (n) => `비추천 ${n}`, expires_in: (s) => `폐기까지 ${s}`,
        support_up: '추천', support_down: '비추천', hours_vote: (h) => `상정되면 ${h} 표결`,
        retract: '표 철회', retracted: '표를 철회했습니다',
        lock_in: (s) => `표 변경 · 철회 마감까지 ${s} (마감 후에는 첫 투표만 가능)`,
        vote_locked_note: '표 변경 마감 — 이미 던진 표는 바꿀 수 없습니다. 아직 안 했다면 투표는 할 수 있어요.',
        // 정당 추가
        leader_title: '지도부 명칭', leader_cannot_leave_hint: (title) => `${title}는 탈당할 수 없습니다 — 위임하거나 해산하세요`,
        dissolve: '정당 해산', dissolve_desc: '모든 당원이 무소속이 됩니다. 되돌릴 수 없습니다. 지난 표결 기록에는 정당 이름이 남습니다.',
        confirm_dissolve: (n) => `정말 해산하려면 정당 이름 「${n}」을 그대로 입력하세요.`, dissolved: '정당을 해산했습니다',
        dissolved_on: (d) => `${d}에 해산된 정당입니다.`,
        add_logo: '로고 올리기', change_logo: '로고 바꾸기', remove_logo: '로고 지우기',
        // 프로필 · 친구 · 로그인
        change_photo: '사진 바꾸기', remove: '지우기', public_profile: '공개 프로필', edit_profile: '프로필 수정',
        friends: '친구', friend_requests: '받은 친구 신청', no_friends: '아직 친구가 없습니다. 다른 의원 프로필에서 친구 신청을 보내 보세요.',
        add_friend: '친구 신청', accept_friend: '수락', unfriend: '친구 끊기', request_sent: '보낸 신청',
        discord_id: '디스코드 ID', discord_verified: 'Discord 로그인으로 확인된 ID (연결을 끊어야 바꿀 수 있음)',
        discord_unverified: '본인이 직접 입력한 ID (확인 안 됨)', discord_manual: '디스코드 사용자명 (직접 입력, 확인 안 됨)',
        discord_who: '누구에게 보여줄까요?', vis_everyone: '모든 사람 (로그인 안 한 방문자 포함)', vis_friends: '친구',
        vis_party: '같은 당 당원', vis_hint: '아무것도 고르지 않으면 나만 볼 수 있습니다.', discord_hidden: '비공개',
        proposed_by_member: '발의한 의제',
        continue_with: (p) => `${p}로 계속하기`, or: '또는', login_methods: '로그인 방법', linked: '연결됨',
        link: '연결', unlink: '연결 끊기', not_configured: '서버에 설정 안 됨',
        set_password: '비밀번호를 만들면 아이디로도 로그인할 수 있습니다.', change_password: '비밀번호 변경', current_password: '현재 비밀번호',
        // 계정
        login: '로그인', register: '의원 등록', logout: '나가기', username: '아이디 (영문 소문자·숫자·_)',
        password: '비밀번호 (8자 이상)', display_name: '의원 이름', country: '국가', no_country: '— 선택 안 함 —',
        my_seat: '내 의석', profile: '프로필', welcome: '의회에 오신 것을 환영합니다, 의원님.',
        have_account: '이미 의원이신가요?', new_here: '처음이신가요?',
        not_in_party: '무소속 — 정당에 입당하거나 직접 창당해 보세요.',
        // 오류
        err: {
            login_required: '먼저 입장해 주세요.', bad_credentials: '아이디 또는 비밀번호가 틀립니다.',
            username_taken: '이미 쓰는 아이디입니다.', invalid_username: '아이디는 영문 소문자·숫자·_ 3~24자입니다.',
            weak_password: '비밀번호는 8자 이상이어야 합니다.', party_name_taken: '같은 이름의 정당이 있습니다.',
            invalid_link: '링크는 http(s):// 로 시작하는 주소여야 합니다.', leader_only: '정당 대표만 할 수 있습니다.',
            agenda_closed: '이미 마감된 의제입니다.', too_many_open_agendas: '추천 단계 · 표결 중인 의제는 한 사람당 3개까지입니다.',
            too_many_requests: '잠시 후 다시 시도해 주세요.', invalid_length: '입력 길이가 맞지 않습니다.',
            missing_field: '필수 항목을 채워 주세요.', network: '서버에 연결할 수 없습니다.',
            no_permission: '권한이 없습니다.', rank_too_low: '자기보다 서열이 낮은 대상만 다룰 수 있습니다.',
            kicked_recently: '제명된 뒤 24시간 동안은 다시 입당할 수 없습니다.', role_name_taken: '같은 이름의 직책이 있습니다.',
            too_many_roles: '직책은 20개까지 만들 수 있습니다.', not_a_member: '그 의원은 당원이 아닙니다.',
            leader_cannot_leave: '대표는 탈당할 수 없습니다. 대표를 위임하거나 정당을 해산하세요.',
            vote_locked: '표 변경 마감이 지나 표를 바꿀 수 없습니다.', not_in_proposal: '추천 단계가 끝난 의제입니다.',
            invalid_image: 'PNG · JPG · WebP · GIF 이미지만 올릴 수 있습니다.', image_too_large: '이미지가 너무 큽니다.', too_large: '요청이 너무 큽니다.',
            oauth_state: '로그인 요청이 만료됐습니다. 다시 시도해 주세요.', oauth_failed: '소셜 로그인에 실패했습니다.',
            oauth_taken: '그 계정은 이미 다른 의원에게 연결되어 있습니다.', last_login_method: '유일한 로그인 방법이라 끊을 수 없습니다. 먼저 비밀번호를 만드세요.',
            invalid_discord: '디스코드 사용자명 형식이 아닙니다.', provider_disabled: '이 서버에서 켜지지 않은 로그인 방법입니다.', user_not_found: '없는 의원입니다.',
        },
    },
    en: {
        tagline: 'World Assembly · every human a deputy',
        tab_chamber: 'Chamber', tab_parties: 'Parties', tab_agendas: 'Agendas', tab_login: 'Enter', lang: '한국어',
        seats: 'seats', SEATS: 'SEATS', members: 'Deputies', parties: 'Parties', open_agendas: 'Open agendas',
        independent: 'Independent', majority: 'Majority', majority_line: (n) => `Majority: ${n} seats`,
        no_members: 'No deputies yet. Be the first!',
        composition: 'Composition',
        join_cta: 'Enter and take your seat',
        create_party: '+ Found a party', edit_party: 'Edit party', join: 'Join', leave: 'Leave', leader: 'Leader',
        your_party: 'Your party', no_parties: 'No parties yet. Found the first one.',
        party_name: 'Party name', party_abbr: 'Abbreviation (optional)', party_color: 'Colour', ideology: 'Ideology',
        left: 'Left', centre: 'Centre', right: 'Right', description: 'About / platform',
        community: 'Party community (external links instead of an in-game board)',
        link_discord: 'Discord server', link_reddit: 'Reddit (subreddit)', link_dcinside: 'DCinside gallery', link_other: 'Other link',
        save: 'Save', cancel: 'Cancel', create: 'Create', transfer_leader: 'Transfer leadership', transfer: 'Transfer',
        member_list: (n) => `${n} member${n === 1 ? '' : 's'}`,
        details: 'Details', back_parties: '← All parties', member_role: 'Member', roles: 'Positions · rank', add_role: '+ Add position',
        role_name: 'Position name', role_placeholder: 'e.g. Deputy Leader, Whip, Secretary-General, Spokesperson', perms: 'Powers', all_perms: 'all powers', no_perms: 'no powers',
        role_perms_hint: 'You can only grant powers you hold, and only manage positions and members ranked below you.',
        rank_hint: 'Higher in the list = higher rank. Everyone can only manage those ranked below them.',
        edit: 'Edit', delete: 'Delete', kick: 'Expel', confirm_kick: (n) => `Expel ${n}? They cannot rejoin for 24 hours.`,
        confirm_role_delete: (n) => `Delete the position "${n}"? Its holders become ordinary members.`,
        perm_edit_info: 'Edit party info', perm_edit_info_desc: 'Name · colour · ideology · platform · community links',
        perm_announce: 'Post notices', perm_announce_desc: 'Write and edit the party notice',
        perm_approve_join: 'Approve members', perm_approve_join_desc: 'Approve or reject join requests, change join policy',
        perm_manage_members: 'Expel members', perm_manage_members_desc: 'Expel members ranked below you (24h rejoin ban)',
        perm_manage_roles: 'Manage positions', perm_manage_roles_desc: 'Create/edit positions below you and appoint or dismiss members',
        perm_set_whip: 'Set party line', perm_set_whip_desc: 'Set the official party position (yea/nay/abstain) on each agenda',
        delegate: 'Hand over leadership', new_leader: 'New leader', after_role: 'My position afterwards',
        delegate_desc: 'Pass the leadership directly to another member. This cannot be undone unless the new leader hands it back.',
        confirm_delegate: (n) => `Make ${n} the party leader?`,
        notice: 'Party notice', edit_notice: 'Edit notice', no_notice: 'No notice.',
        join_policy: 'Join policy', policy_open: 'Open', policy_approval: 'Approval required', requests: 'Join requests',
        no_requests: 'No pending requests.', approve: 'Approve', reject: 'Reject',
        request_join: 'Request to join', cancel_request: 'Cancel request', requested: 'Request sent', pending: 'Pending',
        whip: 'Party line', free_vote: 'Free vote', defections: 'Rebels', my_whip: 'Your party line', set_whip: 'Set party line',
        confirm_leave: 'Leave this party? If you are the last member the party is dissolved.',
        confirm_switch: (name) => `Leave your current party and join "${name}"?`,
        confirm_create_switch: 'Founding a new party makes you leave your current one. Continue?',
        joined: 'Joined', left_party: 'Left the party', created_party: 'Party founded', saved: 'Saved',
        new_agenda: '+ Propose agenda', agenda_title: 'Title', agenda_body: 'Text', duration: 'Voting period',
        hours: (h) => h < 24 ? `${h} h` : `${h / 24} day${h === 24 ? '' : 's'}`, propose: 'Propose',
        open: 'Voting', passed: 'Passed', rejected: 'Rejected', withdrawn: 'Withdrawn',
        yea: 'Yea', nay: 'Nay', abs: 'Abstain', not_voted: 'Not voted',
        remaining: (s) => `${s} left`, closed_at: (s) => `Closed ${s}`,
        by: (n) => `Proposed by ${n}`, your_vote: 'Your vote', change_vote: 'You can change your vote until it closes.',
        login_to_vote: 'Enter the assembly to vote.', withdraw: 'Withdraw', confirm_withdraw: 'Withdraw this agenda?',
        no_agendas: 'No agendas yet.', by_party: 'Votes by party', back: '← All agendas',
        result_rule: (q) => q > 0 ? `Passes if yea > nay and turnout ≥ ${Math.round(q * 100)}%` : 'Passes if yea > nay',
        turnout: 'Turnout', proposed_toast: 'Proposed — now gather sponsors', voted: 'Vote cast',
        proposed: 'Gathering support', expired: 'Expired', sec_open: '🗳️ On the floor', sec_proposed: '📑 Gathering support', sec_past: 'Past agendas',
        flow_hint: (n, d) => `Propose → reach ${n} sponsors (more than opposers) to go to the floor → vote. Expires after ${d} days without enough support.`,
        sponsors: (n, need) => `Sponsors ${n} / ${need}`, opposers: (n) => `Opposed ${n}`, expires_in: (s) => `expires in ${s}`,
        support_up: 'Sponsor', support_down: 'Oppose', hours_vote: (h) => `${h} vote once on the floor`,
        retract: 'Retract vote', retracted: 'Vote retracted',
        lock_in: (s) => `${s} left to change or retract (after that only first-time votes)`,
        vote_locked_note: 'Votes are locked — cast votes can no longer change. You can still vote if you have not yet.',
        leader_title: 'Leader title', leader_cannot_leave_hint: (title) => `The ${title} cannot leave — hand over or dissolve`,
        dissolve: 'Dissolve party', dissolve_desc: 'All members become independents. This cannot be undone. Past roll calls keep the party name.',
        confirm_dissolve: (n) => `To dissolve, type the party name "${n}" exactly.`, dissolved: 'Party dissolved',
        dissolved_on: (d) => `This party was dissolved on ${d}.`,
        add_logo: 'Upload logo', change_logo: 'Change logo', remove_logo: 'Remove logo',
        change_photo: 'Change photo', remove: 'Remove', public_profile: 'Public profile', edit_profile: 'Edit profile',
        friends: 'Friends', friend_requests: 'Friend requests', no_friends: 'No friends yet. Send a request from another deputy’s profile.',
        add_friend: 'Add friend', accept_friend: 'Accept', unfriend: 'Unfriend', request_sent: 'Sent requests',
        discord_id: 'Discord ID', discord_verified: 'Verified through Discord login (unlink to change)',
        discord_unverified: 'Entered by the user (not verified)', discord_manual: 'Discord username (typed, not verified)',
        discord_who: 'Who can see it?', vis_everyone: 'Everyone (including visitors)', vis_friends: 'Friends',
        vis_party: 'Members of my party', vis_hint: 'If nothing is ticked, only you can see it.', discord_hidden: 'hidden',
        proposed_by_member: 'Proposed agendas',
        continue_with: (p) => `Continue with ${p}`, or: 'or', login_methods: 'Sign-in methods', linked: 'Linked',
        link: 'Link', unlink: 'Unlink', not_configured: 'not set up on this server',
        set_password: 'Set a password to also log in with your username.', change_password: 'Change password', current_password: 'Current password',
        login: 'Log in', register: 'Register as deputy', logout: 'Log out', username: 'Username (a-z, 0-9, _)',
        password: 'Password (8+ chars)', display_name: 'Deputy name', country: 'Country', no_country: '— none —',
        my_seat: 'My seat', profile: 'Profile', welcome: 'Welcome to the assembly, deputy.',
        have_account: 'Already a deputy?', new_here: 'New here?',
        not_in_party: 'Independent — join a party or found your own.',
        err: {
            login_required: 'Please enter the assembly first.', bad_credentials: 'Wrong username or password.',
            username_taken: 'Username already taken.', invalid_username: 'Username: 3–24 chars of a-z, 0-9, _.',
            weak_password: 'Password must be at least 8 characters.', party_name_taken: 'A party with that name exists.',
            invalid_link: 'Links must start with http(s)://', leader_only: 'Only the party leader can do that.',
            agenda_closed: 'This agenda is closed.', too_many_open_agendas: 'You can have at most 3 open agendas.',
            too_many_requests: 'Too many attempts — try again later.', invalid_length: 'Input length is out of range.',
            missing_field: 'Please fill in the required fields.', network: 'Cannot reach the server.',
            no_permission: 'You do not have that power.', rank_too_low: 'You can only act on those ranked below you.',
            kicked_recently: 'You were expelled less than 24 hours ago.', role_name_taken: 'A position with that name exists.',
            too_many_roles: 'At most 20 positions.', not_a_member: 'That deputy is not a member.',
            leader_cannot_leave: 'The leader cannot leave. Hand over leadership or dissolve the party.',
            vote_locked: 'Votes are locked; you cannot change yours any more.', not_in_proposal: 'This agenda is no longer gathering support.',
            invalid_image: 'Only PNG, JPG, WebP or GIF images.', image_too_large: 'Image is too large.', too_large: 'Request too large.',
            oauth_state: 'The sign-in request expired. Please try again.', oauth_failed: 'Social sign-in failed.',
            oauth_taken: 'That account is already linked to another deputy.', last_login_method: 'This is your only sign-in method. Set a password first.',
            invalid_discord: 'Not a valid Discord username.', provider_disabled: 'This sign-in method is not enabled.', user_not_found: 'No such deputy.',
        },
    },
};

const COUNTRIES = ('AD AE AF AG AL AM AO AR AT AU AZ BA BB BD BE BF BG BH BI BJ BN BO BR BS BT BW BY BZ CA CD CF CG CH CI CL CM CN CO CR CU CV CY CZ ' +
    'DE DJ DK DM DO DZ EC EE EG ER ES ET FI FJ FM FR GA GB GD GE GH GM GN GQ GR GT GW GY HK HN HR HT HU ID IE IL IN IQ IR IS IT JM JO JP ' +
    'KE KG KH KI KM KN KP KR KW KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MG MH MK ML MM MN MO MR MT MU MV MW MX MY MZ NA NE NG NI NL NO NP ' +
    'NR NZ OM PA PE PG PH PK PL PS PT PW PY QA RO RS RU RW SA SB SC SD SE SG SI SK SL SM SN SO SR SS ST SV SY SZ TD TG TH TJ TL TM TN TO TR TT ' +
    'TV TW TZ UA UG US UY UZ VA VC VE VN VU WS XK YE ZA ZM ZW').split(' ');

const S = {
    lang: safeGet('hn_lang') || (navigator.language?.startsWith('ko') ? 'ko' : 'en'),
    token: safeGet('hn_token'),
    data: null,
    me: null,
    agenda: null,
    route: [],
};

function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch {} }

const t = (key, ...args) => {
    const v = I18N[S.lang][key] ?? I18N.ko[key] ?? key;
    return typeof v === 'function' ? v(...args) : v;
};
const errText = (code) => I18N[S.lang].err[code] || code;
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const $ = (sel, root = document) => root.querySelector(sel);

function flag(code) {
    if (!/^[A-Z]{2}$/.test(code || '')) return '';
    return String.fromCodePoint(...[...code].map(c => 0x1f1e6 + c.charCodeAt(0) - 65));
}
function countryName(code) {
    if (!code) return '';
    try { return new Intl.DisplayNames([S.lang], { type: 'region' }).of(code); } catch { return code; }
}

// ===== API =====
async function api(method, url, body) {
    let res;
    try {
        res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json', ...(S.token ? { Authorization: `Bearer ${S.token}` } : {}) },
            body: body ? JSON.stringify(body) : undefined,
        });
    } catch {
        throw new Error('network');
    }
    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
        if (res.status === 401 && out.error === 'login_required' && S.token) setToken(null);
        throw new Error(out.error || 'server_error');
    }
    return out;
}

function setToken(token) {
    S.token = token;
    safeSet('hn_token', token);
    if (!token) S.me = null;
}

async function refresh() {
    const [data, me] = await Promise.all([
        api('GET', '/api/state'),
        S.token ? api('GET', '/api/me').catch(() => null) : null,
    ]);
    S.data = data;
    S.me = me;
    if (S.route[0] === 'agenda') S.agenda = await api('GET', `/api/agendas/${S.route[1]}`).catch(() => null);
    render();
}

let refreshTimer = null;
function scheduleRefresh() {
    clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => refresh().catch(() => {}), 150);
}

function toast(msg, isErr = false) {
    const el = $('#toast');
    el.textContent = msg;
    el.className = 'toast' + (isErr ? ' err' : '');
    el.hidden = false;
    clearTimeout(toast._t);
    toast._t = setTimeout(() => { el.hidden = true; }, 2600);
}

async function act(fn, okMsg) {
    try {
        await fn();
        document.activeElement?.blur();
        if (okMsg) toast(okMsg);
        await refresh();
        return true;
    } catch (e) {
        toast(errText(e.message), true);
        return false;
    }
}

// ===== 데이터 헬퍼 =====
const partyById = (id) => S.data.parties.find(p => p.id === id);
const activeParties = () => S.data.parties.filter(p => !p.dissolvedAt);
const memberById = (id) => S.data.members.find(m => m.id === id);
const INDEPENDENT_COLOR = '#5a6070';

// 반원 좌석 순서: 정당을 이념 왼쪽→오른쪽으로, 무소속은 맨 끝
function seatOrder(partyOf = null) {
    const pid = (m) => partyOf ? (partyOf[m.id] ?? null) : m.partyId;
    const ideo = (id) => partyById(id)?.ideology ?? 999;
    const counts = {};
    for (const m of S.data.members) counts[pid(m)] = (counts[pid(m)] || 0) + 1;
    return S.data.members
        .filter(m => !partyOf || m.id in partyOf)
        .slice()
        .sort((a, b) => {
            const pa = pid(a), pb = pid(b);
            const ia = partyById(pa) ? ideo(pa) : 999, ib = partyById(pb) ? ideo(pb) : 999;
            if (ia !== ib) return ia - ib;
            if (pa !== pb) return (counts[pb] - counts[pa]) || String(pa).localeCompare(String(pb));
            return a.createdAt - b.createdAt;
        })
        .map(m => ({ member: m, party: partyById(pid(m)) || null }));
}

function partyLabel(p) { return p ? p.name : t('independent'); }
function leaderTitle(p) { return p?.leaderTitle || t('leader'); }

function avatar(m, size = 24) {
    if (m?.avatar) return `<img class="avatar" src="${esc(m.avatar)}" style="width:${size}px;height:${size}px" alt="" loading="lazy" referrerpolicy="no-referrer">`;
    return `<span class="avatar ph" style="width:${size}px;height:${size}px;font-size:${Math.round(size * 0.5)}px">${esc([...(m?.name || '?')][0])}</span>`;
}
function memberLink(m) {
    return `<a class="mlink" href="#/member/${m.id}">${avatar(m, 20)} ${flag(m.country)} ${esc(m.name)}</a>`;
}
function partyLogo(p, size = 20) {
    return p?.logo ? `<img class="logo" src="${esc(p.logo)}" style="width:${size}px;height:${size}px" alt="">` : '';
}
function discordBadge(d) {
    return `<span class="discord-badge" title="${d.verified ? t('discord_verified') : t('discord_unverified')}">◆ ${esc(d.handle)}${d.verified ? ' ✓' : ''}</span>`;
}

function fmtDuration(ms) {
    const m = Math.max(0, Math.round(ms / 60000));
    const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), mm = m % 60;
    if (S.lang === 'ko') return d ? `${d}일 ${h}시간` : h ? `${h}시간 ${mm}분` : `${mm}분`;
    return d ? `${d}d ${h}h` : h ? `${h}h ${mm}m` : `${mm}m`;
}
function fmtDate(ts) {
    return new Date(ts).toLocaleString(S.lang === 'ko' ? 'ko-KR' : 'en-GB', { dateStyle: 'medium', timeStyle: 'short' });
}

// ===== 반원 의석 그리기 + 툴팁 =====
function mountHemicycle(canvas, seatList, { voteOf = null, centerTop, centerBottom } = {}) {
    const voteColors = { yea: '#00ff88', nay: '#ff2244', abs: '#888888' };
    const seats = seatList.map(({ member, party }) => {
        const v = voteOf ? voteOf[member.id] : null;
        return {
            color: party?.color || INDEPENDENT_COLOR,
            voteColor: voteOf ? (voteColors[v] || '#1c1f27') : null,
            highlight: S.me && member.id === S.me.id,
        };
    });
    let hovered = -1;
    const redraw = () => Hemicycle.draw(canvas, seats, { centerTop, centerBottom, hovered });
    redraw();
    const tip = $('#tooltip');
    canvas.onmousemove = (e) => {
        const i = Hemicycle.hitTest(canvas, e.clientX, e.clientY);
        if (i !== hovered) { hovered = i; redraw(); }
        if (i < 0) { tip.hidden = true; return; }
        const { member, party } = seatList[i];
        const v = voteOf ? (voteOf[member.id] || 'not_voted') : null;
        tip.innerHTML = `<div class="row" style="gap:8px">${avatar(member, 28)}<span>${flag(member.country)} ${esc(member.name)}</span></div>` +
            `<div class="dim small"><span class="swatch" style="background:${party?.color || INDEPENDENT_COLOR}"></span> ${esc(partyLabel(party))}${party && member.partyId === party.id ? ` · ${esc(roleName(party, member))}` : ''}</div>` +
            (v ? `<div class="small" style="color:var(--${v === 'not_voted' ? 'text-dim' : v})">${t(v)}</div>` : '');
        tip.hidden = false;
        tip.style.left = Math.min(e.clientX + 14, innerWidth - 270) + 'px';
        tip.style.top = (e.clientY + 14) + 'px';
    };
    canvas.onclick = canvas.onmousemove;
    canvas.onmouseleave = () => { hovered = -1; tip.hidden = true; redraw(); };
    canvas._redraw = redraw;
}

addEventListener('resize', () => document.querySelectorAll('canvas').forEach(c => c._redraw?.()));

// ===== 화면: 의회 =====
function viewChamber() {
    const d = S.data;
    const total = d.members.length;
    const seatList = seatOrder();
    const groups = [];
    for (const s of seatList) {
        const last = groups[groups.length - 1];
        if (last && last.party === s.party) last.n += 1;
        else groups.push({ party: s.party, n: 1 });
    }
    const openCount = d.agendas.filter(a => a.status === 'open').length;
    return `
    <div class="panel">
        <div class="stats">
            <div class="stat"><b>${total}</b><span>${t('members')}</span></div>
            <div class="stat"><b>${activeParties().length}</b><span>${t('parties')}</span></div>
            <div class="stat"><b>${openCount}</b><span>${t('open_agendas')}</span></div>
        </div>
    </div>
    <div class="grid2">
        <div class="panel chamber-wrap">
            ${total ? '<canvas id="chamber"></canvas>' : `<p class="empty">${t('no_members')}</p>`}
            ${!S.me ? `<div class="row" style="justify-content:center;margin-top:12px"><a class="btn" href="#/me">${t('join_cta')}</a></div>` : ''}
        </div>
        <div class="panel">
            <h2>${t('composition')}</h2>
            <ul class="legend">
                ${groups.map(g => `
                <li>
                    <span class="swatch" style="background:${g.party?.color || INDEPENDENT_COLOR}"></span>
                    <span class="name">${partyLogo(g.party, 16)} ${esc(partyLabel(g.party))}${g.party?.abbr ? ` <span class="dim small">${esc(g.party.abbr)}</span>` : ''}</span>
                    <span class="num">${g.n}</span>
                    <span class="pct">${(g.n / total * 100).toFixed(1)}%</span>
                </li>`).join('')}
            </ul>
            ${total ? `<div class="majority">${t('majority_line', Math.floor(total / 2) + 1)}</div>` : ''}
        </div>
    </div>`;
}

// ===== 화면: 정당 =====
function linkButtons(links = {}) {
    const icons = { discord: '◆ Discord', reddit: '● Reddit', dcinside: '■ DC', other: '↗ Link' };
    return Object.entries(links).map(([k, url]) =>
        `<a class="link-btn ${k}" href="${esc(url)}" target="_blank" rel="noopener noreferrer nofollow">${icons[k] || k}</a>`).join('');
}

function ideologyBar(v) {
    return `<div class="ideo"><i style="left:${(v + 100) / 2}%"></i></div>
        <div class="ideo-labels"><span>${t('left')}</span><span>${t('centre')}</span><span>${t('right')}</span></div>`;
}

// ===== 당내 서열 · 권한 (서버 규칙과 같음) =====
// 직책 배열 순서가 서열(앞이 높음). 대표 -1, 직책 0..n-1, 평당원 Infinity
function rankOf(party, m) {
    if (!party || !m) return Infinity;
    if (party.leaderId === m.id) return -1;
    const i = m.partyRoleId ? party.roles.findIndex(r => r.id === m.partyRoleId) : -1;
    return i < 0 ? Infinity : i;
}
function myMember() { return S.me ? memberById(S.me.id) : null; }
function can(party, perm) {
    const me = myMember();
    if (!me || !party || me.partyId !== party.id) return false;
    if (party.leaderId === me.id) return true;
    const role = party.roles.find(r => r.id === me.partyRoleId);
    return !!role && role.perms.includes(perm);
}
function roleName(party, m) {
    if (!party) return '';
    if (party.leaderId === m.id) return leaderTitle(party);
    return party.roles.find(r => r.id === m.partyRoleId)?.name || t('member_role');
}
function partyMembersSorted(party) {
    return S.data.members.filter(m => m.partyId === party.id)
        .sort((a, b) => (rankOf(party, a) - rankOf(party, b)) || a.createdAt - b.createdAt);
}

function joinButtons(p) {
    if (!S.me) return '';
    if (S.me.partyId === p.id) {
        // 대표는 탈당할 수 없음 — 위임하거나 해산
        return p.leaderId === S.me.id ? `<span class="dim small">${t('leader_cannot_leave_hint', leaderTitle(p))}</span>`
            : `<button class="btn small danger" data-action="leave">${t('leave')}</button>`;
    }
    if (p.requests[S.me.id]) return `<span class="tag">${t('pending')}</span> <button class="btn small ghost" data-action="cancel-request" data-id="${p.id}">${t('cancel_request')}</button>`;
    return `<button class="btn small" data-action="join" data-id="${p.id}">${p.joinPolicy === 'approval' ? t('request_join') : t('join')}</button>`;
}

function partyHead(p, big = false) {
    const leader = memberById(p.leaderId);
    return `
        <div class="head">
            ${partyLogo(p, big ? 56 : 32)}
            ${big ? `<h2 style="margin:0;color:${p.color}">${esc(p.name)}</h2>` : `<h3><a href="#/party/${p.id}" style="color:inherit;text-decoration:none">${esc(p.name)}</a></h3>`}
            ${p.abbr ? `<span class="tag">${esc(p.abbr)}</span>` : ''}
            ${S.me?.partyId === p.id ? `<span class="tag open">${t('your_party')}</span>` : ''}
            ${p.joinPolicy === 'approval' ? `<span class="tag">${t('policy_approval')}</span>` : ''}
            <span class="dim" style="margin-left:auto">${p.seats} ${t('seats')}</span>
        </div>
        <div class="dim small">${esc(leaderTitle(p))}: ${leader ? memberLink(leader) : '-'}</div>
        ${ideologyBar(p.ideology)}
        ${p.description ? `<div class="desc">${esc(p.description)}</div>` : ''}
        <div class="links">${linkButtons(p.links)}</div>`;
}

function viewParties() {
    const parties = activeParties().sort((a, b) => b.seats - a.seats || a.createdAt - b.createdAt);
    return `
    <div class="row spread" style="margin-bottom:16px">
        <h2 style="margin:0">${t('tab_parties')}</h2>
        ${S.me ? `<button class="btn" data-action="create-party">${t('create_party')}</button>` : ''}
    </div>
    ${parties.length ? '' : `<p class="empty">${t('no_parties')}</p>`}
    ${parties.map(p => `
        <div class="panel party-card" style="--c:${p.color}">
            ${partyHead(p)}
            ${p.notice ? `<div class="notice small">📢 ${esc(p.notice.length > 140 ? p.notice.slice(0, 140) + '…' : p.notice)}</div>` : ''}
            <div class="row" style="margin-top:12px">
                ${joinButtons(p)}
                <a class="btn small ghost" href="#/party/${p.id}">${t('details')} →</a>
            </div>
        </div>`).join('')}`;
}

function viewParty() {
    const p = partyById(S.route[1]);
    if (!p) return `<p><a href="#/parties">${t('back_parties')}</a></p><p class="empty">404</p>`;
    if (p.dissolvedAt) return `<p><a href="#/parties">${t('back_parties')}</a></p>
        <div class="panel party-card" style="--c:${p.color}"><h2 style="color:${p.color}">${partyLogo(p, 32)} ${esc(p.name)}</h2>
        <p class="dim">${t('dissolved_on', fmtDate(p.dissolvedAt))}</p></div>`;
    const me = myMember();
    const myRank = rankOf(p, me);
    const isLeader = me && p.leaderId === me.id;
    const members = partyMembersSorted(p);
    const canRoles = can(p, 'manage_roles'), canKick = can(p, 'manage_members');
    const noticeBy = memberById(p.noticeBy);

    const memberRow = (m) => {
        const below = myRank < rankOf(p, m);
        const roleCell = canRoles && below
            ? `<select data-change="set-role" data-id="${m.id}">
                <option value="">${t('member_role')}</option>
                ${p.roles.map((r, i) => i > myRank ? `<option value="${r.id}"${r.id === m.partyRoleId ? ' selected' : ''}>${esc(r.name)}</option>` : '').join('')}
               </select>`
            : `<span class="${p.leaderId === m.id ? 'gold' : m.partyRoleId ? '' : 'dim'}">${p.leaderId === m.id ? '★ ' : ''}${esc(roleName(p, m))}</span>`;
        return `<tr>
            <td>${memberLink(m)}${me && m.id === me.id ? ' <span class="dim small">(me)</span>' : ''}</td>
            <td>${roleCell}</td>
            <td>${canKick && below ? `<button class="btn small danger" data-action="kick" data-id="${m.id}">${t('kick')}</button>` : ''}</td>
        </tr>`;
    };

    const rolesPanel = `
        <div class="panel">
            <div class="row spread"><h3 style="margin:0">${t('roles')}</h3>
                ${canRoles ? `<button class="btn small" data-action="add-role">${t('add_role')}</button>` : ''}</div>
            <p class="dim small" style="margin-top:8px">${t('rank_hint')}</p>
            <ol class="roles">
                <li><span class="gold">★ ${esc(leaderTitle(p))}</span> <span class="dim small">— ${t('all_perms')}</span></li>
                ${p.roles.map((r, i) => {
                    const editable = canRoles && i > myRank;
                    return `<li>
                        <div class="row spread">
                            <span>${esc(r.name)} <span class="dim small">(${members.filter(m => m.partyRoleId === r.id).length})</span></span>
                            ${editable ? `<span class="row" style="gap:4px">
                                ${i - 1 > myRank ? `<button class="btn small ghost" data-action="role-move" data-id="${r.id}" data-dir="up">▲</button>` : ''}
                                ${i < p.roles.length - 1 ? `<button class="btn small ghost" data-action="role-move" data-id="${r.id}" data-dir="down">▼</button>` : ''}
                                <button class="btn small ghost" data-action="role-edit" data-id="${r.id}">${t('edit')}</button>
                                <button class="btn small danger" data-action="role-delete" data-id="${r.id}">${t('delete')}</button>
                            </span>` : ''}
                        </div>
                        <div class="chips">${r.perms.length ? r.perms.map(x => `<span class="chip">${t('perm_' + x)}</span>`).join('') : `<span class="dim small">${t('no_perms')}</span>`}</div>
                    </li>`;
                }).join('')}
                <li><span class="dim">${t('member_role')}</span></li>
            </ol>
        </div>`;

    const requests = Object.entries(p.requests).map(([uid, ts]) => ({ m: memberById(uid), ts })).filter(r => r.m);
    const requestsPanel = can(p, 'approve_join') ? `
        <div class="panel">
            <h3>${t('requests')}</h3>
            <label>${t('join_policy')}
                <select data-change="join-policy">
                    <option value="open"${p.joinPolicy === 'open' ? ' selected' : ''}>${t('policy_open')}</option>
                    <option value="approval"${p.joinPolicy === 'approval' ? ' selected' : ''}>${t('policy_approval')}</option>
                </select></label>
            ${requests.length ? `<table>${requests.map(({ m, ts }) => `<tr>
                <td>${flag(m.country)} ${esc(m.name)} <span class="dim small">${fmtDate(ts)}</span></td>
                <td><button class="btn small" data-action="request" data-id="${m.id}" data-decision="approve">${t('approve')}</button>
                    <button class="btn small ghost" data-action="request" data-id="${m.id}" data-decision="reject">${t('reject')}</button></td>
            </tr>`).join('')}</table>` : `<p class="dim small">${t('no_requests')}</p>`}
        </div>` : '';

    const others = members.filter(m => m.id !== me?.id);
    const delegatePanel = isLeader && others.length ? `
        <form class="panel" id="delegateForm">
            <h3>${t('delegate')}</h3>
            <p class="dim small">${t('delegate_desc')}</p>
            <label>${t('new_leader')}<select name="userId">${others.map(m =>
                `<option value="${m.id}">${flag(m.country)} ${esc(m.name)} — ${esc(roleName(p, m))}</option>`).join('')}</select></label>
            <label>${t('after_role')}<select name="keepRoleId"><option value="">${t('member_role')}</option>${p.roles.map(r =>
                `<option value="${r.id}">${esc(r.name)}</option>`).join('')}</select></label>
            <button class="btn">${t('delegate')}</button>
        </form>` : '';
    const dissolvePanel = isLeader ? `
        <div class="panel danger-zone">
            <h3>${t('dissolve')}</h3>
            <p class="dim small">${t('dissolve_desc')}</p>
            <button class="btn small danger" data-action="dissolve">${t('dissolve')}</button>
        </div>` : '';

    return `
    <p><a href="#/parties">${t('back_parties')}</a></p>
    <div class="panel party-card" style="--c:${p.color}">
        ${partyHead(p, true)}
        <div class="row" style="margin-top:12px">
            ${joinButtons(p)}
            ${can(p, 'edit_info') ? `<button class="btn small ghost" data-action="edit-party" data-id="${p.id}">${t('edit_party')}</button>
                <button class="btn small ghost" data-action="logo-upload">${p.logo ? t('change_logo') : t('add_logo')}</button>
                ${p.logo ? `<button class="btn small ghost" data-action="logo-remove">${t('remove_logo')}</button>` : ''}` : ''}
        </div>
    </div>
    <div class="panel">
        <div class="row spread"><h3 style="margin:0">📢 ${t('notice')}</h3>
            ${can(p, 'announce') ? `<button class="btn small ghost" data-action="edit-notice">${t('edit_notice')}</button>` : ''}</div>
        ${p.notice ? `<div class="desc" style="margin-top:10px">${esc(p.notice)}</div>
            <div class="dim small" style="margin-top:6px">${noticeBy ? esc(noticeBy.name) + ' · ' : ''}${p.noticeAt ? fmtDate(p.noticeAt) : ''}</div>`
            : `<p class="dim small" style="margin-top:10px">${t('no_notice')}</p>`}
    </div>
    <div class="grid2">
        <div class="panel">
            <h3>${t('member_list', members.length)}</h3>
            <div class="scroll"><table>${members.map(memberRow).join('')}</table></div>
        </div>
        <div>${rolesPanel}${requestsPanel}${delegatePanel}${dissolvePanel}</div>
    </div>`;
}

function bindPartyForms() {
    const form = $('#delegateForm');
    if (!form) return;
    form.onsubmit = (e) => {
        e.preventDefault();
        const p = partyById(S.route[1]);
        const target = memberById(form.userId.value);
        if (!confirm(t('confirm_delegate', target.name))) return;
        act(() => api('POST', `/api/parties/${p.id}/leader`, { userId: target.id, keepRoleId: form.keepRoleId.value || null }), t('saved'));
    };
}

function openRoleForm(party, role) {
    openDialog(`
        <form id="roleForm">
            <h2>${role ? t('edit') : t('add_role').replace('+ ', '')}</h2>
            <label>${t('role_name')}<input name="name" maxlength="30" required value="${esc(role?.name)}" placeholder="${t('role_placeholder')}"></label>
            <p class="dim small">${t('perms')} — ${t('role_perms_hint')}</p>
            ${S.data.perms.map(x => `<label class="check"><input type="checkbox" name="perms" value="${x}"${role?.perms.includes(x) ? ' checked' : ''}${can(party, x) ? '' : ' disabled'}>
                <span><b>${t('perm_' + x)}</b><br><span class="dim small">${t('perm_' + x + '_desc')}</span></span></label>`).join('')}
            <div class="form-error" id="formErr"></div>
            <div class="row" style="justify-content:flex-end">
                <button type="button" class="btn ghost" data-action="close-dialog">${t('cancel')}</button>
                <button class="btn">${role ? t('save') : t('create')}</button>
            </div>
        </form>`, (dlg) => {
        const form = $('#roleForm', dlg);
        form.onsubmit = async (e) => {
            e.preventDefault();
            const body = { name: form.elements.name.value, perms: [...form.querySelectorAll('[name=perms]:checked')].map(c => c.value) };
            try {
                if (role) await api('PATCH', `/api/parties/${party.id}/roles/${role.id}`, body);
                else await api('POST', `/api/parties/${party.id}/roles`, body);
                dlg.close();
                toast(t('saved'));
                await refresh();
            } catch (err) {
                $('#formErr', dlg).textContent = errText(err.message);
            }
        };
    });
}

function openNoticeForm(party) {
    openDialog(`
        <form id="noticeForm">
            <h2>${t('edit_notice')}</h2>
            <label>${t('notice')}<textarea name="notice" maxlength="2000" rows="8">${esc(party.notice)}</textarea></label>
            <div class="form-error" id="formErr"></div>
            <div class="row" style="justify-content:flex-end">
                <button type="button" class="btn ghost" data-action="close-dialog">${t('cancel')}</button>
                <button class="btn">${t('save')}</button>
            </div>
        </form>`, (dlg) => {
        $('#noticeForm', dlg).onsubmit = async (e) => {
            e.preventDefault();
            const ok = await act(() => api('PATCH', `/api/parties/${party.id}`, { notice: e.target.notice.value }), t('saved'));
            if (ok) dlg.close();
        };
    });
}

function partyForm(p) {
    const links = p?.links || {};
    return `
    <form id="partyForm">
        <h2>${p ? t('edit_party') : t('create_party').replace('+ ', '')}</h2>
        <label>${t('party_name')}<input name="name" maxlength="40" required value="${esc(p?.name)}"></label>
        <div class="row">
            <label style="flex:1">${t('party_abbr')}<input name="abbr" maxlength="8" value="${esc(p?.abbr)}"></label>
            <label style="flex:1">${t('leader_title')}<input name="leaderTitle" maxlength="20" placeholder="${t('leader')}" value="${esc(p?.leaderTitle)}"></label>
            <label>${t('party_color')}<input type="color" name="color" value="${esc(p?.color || randomColor())}"></label>
        </div>
        <label>${t('ideology')} <span id="ideoVal" class="dim"></span>
            <input type="range" name="ideology" min="-100" max="100" value="${p?.ideology ?? 0}">
        </label>
        <div class="ideo-labels"><span>${t('left')}</span><span>${t('centre')}</span><span>${t('right')}</span></div>
        <label>${t('description')}<textarea name="description" maxlength="1000">${esc(p?.description)}</textarea></label>
        <p class="dim small">${t('community')}</p>
        <label>${t('link_discord')}<input name="discord" placeholder="https://discord.gg/..." value="${esc(links.discord)}"></label>
        <label>${t('link_reddit')}<input name="reddit" placeholder="https://www.reddit.com/r/..." value="${esc(links.reddit)}"></label>
        <label>${t('link_dcinside')}<input name="dcinside" placeholder="https://gall.dcinside.com/..." value="${esc(links.dcinside)}"></label>
        <label>${t('link_other')}<input name="other" placeholder="https://..." value="${esc(links.other)}"></label>
        <div class="form-error" id="formErr"></div>
        <div class="row" style="justify-content:flex-end">
            <button type="button" class="btn ghost" data-action="close-dialog">${t('cancel')}</button>
            <button class="btn">${p ? t('save') : t('create')}</button>
        </div>
    </form>`;
}

function randomColor() {
    const h = Math.random() * 360, sat = 0.7, l = 0.55;
    const a = sat * Math.min(l, 1 - l);
    const f = (n) => {
        const k = (n + h / 30) % 12;
        return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}

function openDialog(html, onMount) {
    const dlg = $('#dialog');
    dlg.innerHTML = html;
    dlg.showModal();
    onMount?.(dlg);
}

function openPartyForm(party) {
    if (!party && S.me.partyId) {
        if (partyById(S.me.partyId)?.leaderId === S.me.id) return toast(errText('leader_cannot_leave'), true);
        if (!confirm(t('confirm_create_switch'))) return;
    }
    openDialog(partyForm(party), (dlg) => {
        const form = $('#partyForm', dlg);
        const ideoVal = $('#ideoVal', dlg);
        const showIdeo = () => { ideoVal.textContent = form.ideology.value; };
        form.ideology.oninput = showIdeo;
        showIdeo();
        form.onsubmit = async (e) => {
            e.preventDefault();
            const f = form.elements;
            const body = {
                name: f.name.value, abbr: f.abbr.value, leaderTitle: f.leaderTitle.value, color: f.color.value, ideology: Number(f.ideology.value),
                description: f.description.value,
                links: { discord: f.discord.value, reddit: f.reddit.value, dcinside: f.dcinside.value, other: f.other.value },
            };
            try {
                if (party) await api('PATCH', `/api/parties/${party.id}`, body);
                else await api('POST', '/api/parties', body);
                dlg.close();
                toast(party ? t('saved') : t('created_party'));
                await refresh();
            } catch (err) {
                $('#formErr', dlg).textContent = errText(err.message);
            }
        };
    });
}

// ===== 화면: 의제 =====
function tallyBar(tl, total) {
    const pct = (n) => total ? (n / total * 100) : 0;
    return `<div class="bar"><div class="y" style="width:${pct(tl.yea)}%"></div><div class="n" style="width:${pct(tl.nay)}%"></div><div class="a" style="width:${pct(tl.abs)}%"></div></div>
        <div class="tally"><span class="y">${t('yea')} ${tl.yea}</span><span class="n">${t('nay')} ${tl.nay}</span><span class="a">${t('abs')} ${tl.abs}</span><span class="dim">${t('not_voted')} ${Math.max(0, total - tl.yea - tl.nay - tl.abs)}</span></div>`;
}

function statusTag(a) { return `<span class="tag ${a.status}">${t(a.status)}</span>`; }

// 추천 단계: 추천 막대(필요 수 대비)와 추천 · 비추천 버튼
function supportBlock(a) {
    const need = S.data.rules.sponsorsNeeded;
    const pct = Math.min(100, a.support.up / need * 100);
    const btn = (v, label, cls) => `<button class="btn small ${cls}${a.mySupport === v ? ' on' : ''}" data-action="support" data-id="${a.id}" data-value="${a.mySupport === v ? 0 : v}"${S.me ? '' : ' disabled'}>${label}</button>`;
    return `
        <div class="bar"><div class="y" style="width:${pct}%"></div></div>
        <div class="row spread small">
            <span><span style="color:var(--yea)">${t('sponsors', a.support.up, need)}</span> · <span style="color:var(--nay)">${t('opposers', a.support.down)}</span></span>
            <span class="dim">${t('expires_in', fmtDuration(a.expiresAt - Date.now()))}</span>
        </div>
        <div class="row" style="margin-top:8px">${btn(1, '▲ ' + t('support_up'), 'yea')}${btn(-1, '▼ ' + t('support_down'), 'nay')}</div>`;
}

function agendaCard(a) {
    const author = memberById(a.authorId);
    const total = S.data.members.length;
    const when = a.status === 'proposed' ? `${t('hours_vote', t('hours', a.hours))}`
        : a.status === 'open' ? t('remaining', fmtDuration(a.closesAt - Date.now()))
        : a.closesAt ? t('closed_at', fmtDate(a.closesAt)) : fmtDate(a.createdAt);
    return `
    <div class="panel agenda-item">
        <div class="row spread">
            <h3 style="margin:0"><a href="#/agenda/${a.id}" class="plain">${esc(a.title)}</a></h3>
            ${statusTag(a)}
        </div>
        <div class="dim small">${t('by', author ? memberLink(author) : '-')} · ${when}</div>
        ${a.status === 'proposed' ? supportBlock(a) : a.status === 'expired' || (a.status === 'withdrawn' && !a.openedAt) ? '' : tallyBar(a.tally, total)}
    </div>`;
}

function viewAgendas() {
    const all = S.data.agendas;
    const open = all.filter(a => a.status === 'open').sort((a, b) => a.closesAt - b.closesAt);
    const proposed = all.filter(a => a.status === 'proposed').sort((a, b) => (b.support.up - b.support.down) - (a.support.up - a.support.down));
    const past = all.filter(a => !['open', 'proposed'].includes(a.status)).sort((a, b) => (b.closesAt || b.createdAt) - (a.closesAt || a.createdAt));
    const section = (title, list, hint) => `
        <h3 class="section">${title} <span class="dim small">${list.length}</span></h3>
        ${hint ? `<p class="dim small">${hint}</p>` : ''}
        ${list.length ? list.map(agendaCard).join('') : `<p class="empty small">—</p>`}`;
    return `
    <div class="row spread" style="margin-bottom:16px">
        <h2 style="margin:0">${t('tab_agendas')}</h2>
        ${S.me ? `<button class="btn" data-action="new-agenda">${t('new_agenda')}</button>` : ''}
    </div>
    <p class="dim small">${t('flow_hint', S.data.rules.sponsorsNeeded, S.data.rules.proposalDays)} ${t('result_rule', S.data.rules.quorum)}</p>
    ${all.length ? '' : `<p class="empty">${t('no_agendas')}</p>`}
    ${section(t('sec_open'), open)}
    ${section(t('sec_proposed'), proposed)}
    ${past.length ? section(t('sec_past'), past) : ''}`;
}

function openAgendaForm() {
    const choices = [1, 6, 12, 24, 48, 72, 168];
    openDialog(`
        <form id="agendaForm">
            <h2>${t('new_agenda').replace('+ ', '')}</h2>
            <p class="dim small">${t('flow_hint', S.data.rules.sponsorsNeeded, S.data.rules.proposalDays)}</p>
            <label>${t('agenda_title')}<input name="title" maxlength="120" minlength="4" required></label>
            <label>${t('agenda_body')}<textarea name="body" maxlength="5000" rows="8"></textarea></label>
            <label>${t('duration')}<select name="hours">${choices.map(h =>
                `<option value="${h}"${h === S.data.rules.agendaDefaultHours ? ' selected' : ''}>${t('hours', h)}</option>`).join('')}</select></label>
            <div class="form-error" id="formErr"></div>
            <div class="row" style="justify-content:flex-end">
                <button type="button" class="btn ghost" data-action="close-dialog">${t('cancel')}</button>
                <button class="btn">${t('propose')}</button>
            </div>
        </form>`, (dlg) => {
        $('#agendaForm', dlg).onsubmit = async (e) => {
            e.preventDefault();
            const f = e.target.elements;
            try {
                const a = await api('POST', '/api/agendas', { title: f.title.value, body: f.body.value, hours: Number(f.hours.value) });
                dlg.close();
                toast(t('proposed_toast'));
                location.hash = `#/agenda/${a.id}`;
            } catch (err) {
                $('#formErr', dlg).textContent = errText(err.message);
            }
        };
    });
}

function agendaSeats(a) {
    // 마감된 의제는 마감 순간의 의석 구성으로, 진행 중인 의제는 지금 구성으로
    return a.snapshot ? seatOrder(a.snapshot) : seatOrder();
}

function whipControl(a) {
    const myParty = S.me ? partyById(S.me.partyId) : null;
    if (!myParty || !can(myParty, 'set_whip') || !['proposed', 'open'].includes(a.status)) return '';
    const myWhip = a.whips[myParty.id] || 'free';
    return `<label style="margin-top:12px">${t('set_whip')} — ${esc(myParty.name)}
        <select data-change="whip">${['free', 'yea', 'nay', 'abs'].map(c =>
            `<option value="${c}"${myWhip === c ? ' selected' : ''}>${c === 'free' ? t('free_vote') : t(c)}</option>`).join('')}</select></label>`;
}

function viewAgenda() {
    const a = S.agenda;
    if (!a) return `<p class="empty">${S.agendaLoading ? '…' : '404'}</p>`;
    const author = memberById(a.authorId);
    const isOpen = a.status === 'open';
    const now = Date.now();
    const myParty = S.me ? partyById(S.me.partyId) : null;
    const myWhip = myParty ? a.whips[myParty.id] : null;
    const head = `
    <p><a href="#/agendas">${t('back')}</a></p>
    <div class="panel">
        <div class="row spread"><h2 style="margin:0">${esc(a.title)}</h2>${statusTag(a)}</div>
        <div class="dim small" style="margin:6px 0 12px">${t('by', author ? memberLink(author) : '-')} · ${fmtDate(a.createdAt)}
            ${isOpen ? ` · ${t('remaining', fmtDuration(a.closesAt - now))}` : a.closesAt ? ` · ${t('closed_at', fmtDate(a.closesAt))}` : ''}</div>
        ${a.body ? `<div class="desc">${esc(a.body)}</div>` : ''}
    </div>`;
    const withdrawBtn = S.me && a.authorId === S.me.id && ['open', 'proposed'].includes(a.status)
        ? `<button class="btn small ghost" style="margin-top:12px" data-action="withdraw">${t('withdraw')}</button>` : '';

    // 추천 단계 · 폐기: 반원 대신 추천 현황
    if (a.status === 'proposed' || a.status === 'expired' || (a.status === 'withdrawn' && !a.openedAt)) {
        return head + `
        <div class="panel">
            <h3>${t('sec_proposed')}</h3>
            <p class="dim small">${t('flow_hint', S.data.rules.sponsorsNeeded, S.data.rules.proposalDays)} ${t('hours_vote', t('hours', a.hours))}</p>
            ${a.status === 'proposed' ? supportBlock(a) : `<p>${t('sponsors', a.support.up, S.data.rules.sponsorsNeeded)} · ${t('opposers', a.support.down)}</p>`}
            ${myWhip ? `<div class="whip-note" style="margin-top:10px">${t('my_whip')}: <b style="color:var(--${myWhip})">${t(myWhip)}</b></div>` : ''}
            ${whipControl(a)}
            ${withdrawBtn}
        </div>`;
    }

    const seatList = agendaSeats(a);
    const total = seatList.length;
    const myVote = S.me ? a.votes[S.me.id] : null;
    const locked = now >= a.lockAt;
    const cast = a.tally.yea + a.tally.nay + a.tally.abs;

    // 정당별 표결
    const rows = new Map();
    for (const { member, party } of seatList) {
        const key = party?.id || '_ind';
        if (!rows.has(key)) rows.set(key, { party, yea: 0, nay: 0, abs: 0, none: 0, rebels: 0 });
        const row = rows.get(key), v = a.votes[member.id];
        row[v || 'none'] += 1;
        const whip = party && a.whips[party.id];
        if (whip && v && v !== whip) row.rebels += 1;
    }
    const canChange = !myVote || !locked;
    const lockNote = isOpen ? (locked
        ? `<div class="lock-note locked">🔒 ${t('vote_locked_note')}</div>`
        : `<div class="lock-note">${t('lock_in', fmtDuration(a.lockAt - now))}</div>`) : '';

    return head + `
    <div class="grid2">
        <div class="panel chamber-wrap">
            ${total ? '<canvas id="chamber"></canvas>' : ''}
            <div class="vote-legend">
                <span><span class="swatch" style="background:var(--yea)"></span>${t('yea')}</span>
                <span><span class="swatch" style="background:var(--nay)"></span>${t('nay')}</span>
                <span><span class="swatch" style="background:var(--abs)"></span>${t('abs')}</span>
                <span><span class="swatch" style="background:#1c1f27;border:1px solid #444"></span>${t('not_voted')}</span>
            </div>
        </div>
        <div class="panel">
            ${!isOpen && a.status !== 'withdrawn' ? `<div class="result ${a.status}">${t(a.status)}</div>` : ''}
            ${tallyBar(a.tally, total)}
            <div class="dim small" style="margin-top:6px">${t('turnout')} ${total ? (cast / total * 100).toFixed(1) : 0}% · ${t('result_rule', S.data.rules.quorum)}</div>
            ${isOpen ? (S.me ? `
                <div class="vote-row">
                    ${['yea', 'nay', 'abs'].map(c => `<button class="btn ${c}${myVote === c ? ' on' : ''}" data-action="vote" data-choice="${c}"${canChange ? '' : ' disabled'}>${t(c)}</button>`).join('')}
                </div>
                ${myWhip ? `<div class="whip-note">${t('my_whip')}: <b style="color:var(--${myWhip})">${t(myWhip)}</b></div>` : ''}
                ${myVote ? `<div class="small">${t('your_vote')}: <b style="color:var(--${myVote})">${t(myVote)}</b>
                    ${!locked ? ` · <a href="#" data-action="retract">${t('retract')}</a>` : ''}</div>` : ''}
                ${lockNote}
                ${whipControl(a)}
                ${withdrawBtn}
            ` : `<p style="margin-top:12px"><a class="btn" href="#/me">${t('login_to_vote')}</a></p>`) : ''}
        </div>
    </div>
    <div class="panel">
        <h3>${t('by_party')}</h3>
        <table>
            <tr><th></th><th>${t('whip')}</th><th>${t('yea')}</th><th>${t('nay')}</th><th>${t('abs')}</th><th>${t('not_voted')}</th><th>${t('defections')}</th></tr>
            ${[...rows.values()].map(r => `<tr>
                <td>${r.party?.logo ? partyLogo(r.party, 16) : `<span class="swatch" style="background:${r.party?.color || INDEPENDENT_COLOR}"></span>`} ${esc(partyLabel(r.party))}</td>
                <td>${(() => { const w = r.party && a.whips[r.party.id]; return w ? `<span style="color:var(--${w})">${t(w)}</span>` : `<span class="dim">${r.party ? t('free_vote') : '-'}</span>`; })()}</td>
                <td style="color:var(--yea)">${r.yea}</td><td style="color:var(--nay)">${r.nay}</td><td style="color:var(--abs)">${r.abs}</td><td class="dim">${r.none}</td>
                <td${r.rebels ? ' style="color:var(--gold)"' : ' class="dim"'}>${r.rebels}</td>
            </tr>`).join('')}
        </table>
    </div>`;
}

// ===== 화면: 계정 =====
function countryOptions(selected) {
    const opts = COUNTRIES.map(c => ({ c, n: countryName(c) })).sort((a, b) => a.n.localeCompare(b.n, S.lang));
    return `<option value="">${t('no_country')}</option>` +
        opts.map(o => `<option value="${o.c}"${o.c === selected ? ' selected' : ''}>${flag(o.c)} ${esc(o.n)}</option>`).join('');
}

function guessCountry() {
    const m = /-([A-Z]{2})$/.exec(navigator.language || '');
    return m && COUNTRIES.includes(m[1]) ? m[1] : '';
}

const PROVIDERS = { discord: { label: 'Discord', cls: 'discord' }, google: { label: 'Google', cls: 'google' } };

function oauthButtons() {
    const list = S.data.rules.oauth || [];
    if (!list.length) return '';
    return `<div class="oauth">${list.map(p =>
        `<button type="button" class="btn oauth-btn ${PROVIDERS[p].cls}" data-action="oauth" data-id="${p}">${t('continue_with', PROVIDERS[p].label)}</button>`).join('')}</div>
        <div class="or"><span>${t('or')}</span></div>`;
}

function friendState(uid) {
    return S.me?.friends.find(f => f.userId === uid)?.status || null;
}

function friendButton(m) {
    if (!S.me || m.id === S.me.id) return '';
    const st = friendState(m.id);
    if (st === 'friends') return `<button class="btn small ghost" data-action="unfriend" data-id="${m.id}">${t('unfriend')}</button>`;
    if (st === 'outgoing') return `<span class="tag">${t('request_sent')}</span> <button class="btn small ghost" data-action="unfriend" data-id="${m.id}">${t('cancel')}</button>`;
    if (st === 'incoming') return `<button class="btn small" data-action="befriend" data-id="${m.id}">${t('accept_friend')}</button> <button class="btn small ghost" data-action="unfriend" data-id="${m.id}">${t('reject')}</button>`;
    return `<button class="btn small" data-action="befriend" data-id="${m.id}">${t('add_friend')}</button>`;
}

function viewMe() {
    if (!S.me) {
        return `
        <div class="grid2">
            <form class="panel" id="registerForm">
                <h2>${t('register')}</h2>
                <p class="dim small">${t('new_here')}</p>
                ${oauthButtons()}
                <label>${t('username')}<input name="username" autocomplete="username" required minlength="3" maxlength="24" pattern="[a-z0-9_]+"></label>
                <label>${t('password')}<input name="password" type="password" autocomplete="new-password" required minlength="8"></label>
                <label>${t('display_name')}<input name="name" maxlength="40"></label>
                <label>${t('country')}<select name="country">${countryOptions(guessCountry())}</select></label>
                <div class="form-error"></div>
                <button class="btn">${t('register')}</button>
            </form>
            <form class="panel" id="loginForm">
                <h2>${t('login')}</h2>
                <p class="dim small">${t('have_account')}</p>
                ${oauthButtons()}
                <label>${t('username')}<input name="username" autocomplete="username" required></label>
                <label>${t('password')}<input name="password" type="password" autocomplete="current-password" required></label>
                <div class="form-error"></div>
                <button class="btn">${t('login')}</button>
            </form>
        </div>`;
    }
    const me = S.me;
    const party = partyById(me.partyId);
    const seatNo = seatOrder().findIndex(s => s.member.id === me.id) + 1;
    const vis = me.discordVisibility;
    const verified = me.discord?.verified;
    const friendsOf = (st) => me.friends.filter(f => f.status === st).map(f => memberById(f.userId)).filter(Boolean);
    const incoming = friendsOf('incoming'), friends = friendsOf('friends'), outgoing = friendsOf('outgoing');
    const enabled = S.data.rules.oauth || [];

    return `
    <div class="grid2">
        <div>
            <div class="panel">
                <h2>${t('my_seat')} #${seatNo}</h2>
                <div class="row" style="align-items:flex-start;gap:16px">
                    <div class="avatar-edit">
                        ${avatar(me, 88)}
                        <button class="btn small ghost" data-action="avatar-upload">${t('change_photo')}</button>
                        ${me.avatar ? `<button class="btn small ghost" data-action="avatar-remove">${t('remove')}</button>` : ''}
                    </div>
                    <div style="flex:1;min-width:0">
                        <p style="font-size:1.2rem;margin:0">${flag(me.country)} ${esc(me.name)}</p>
                        <p class="dim small">@${esc(me.username)} · <a href="#/member/${me.id}">${t('public_profile')}</a></p>
                        ${party ? `<p>${partyLogo(party, 18) || `<span class="swatch" style="background:${party.color}"></span>`} <a href="#/party/${party.id}">${esc(party.name)}</a> · ${esc(roleName(party, myMember()))}</p>
                            <div class="links">${linkButtons(party.links)}</div>`
                            : `<p class="dim">${t('not_in_party')}</p><a class="btn small" href="#/parties">${t('tab_parties')} →</a>`}
                        ${me.discord ? `<p>${discordBadge(me.discord)}</p>` : ''}
                    </div>
                </div>
                <div style="margin-top:18px"><button class="btn small danger" data-action="logout">${t('logout')}</button></div>
            </div>
            <div class="panel">
                <h3>${t('friends')} <span class="dim small">${friends.length}</span></h3>
                ${incoming.length ? `<p class="small gold">${t('friend_requests')}</p>
                    <table>${incoming.map(m => `<tr><td>${memberLink(m)}</td><td>${friendButton(m)}</td></tr>`).join('')}</table>` : ''}
                ${friends.length ? `<table>${friends.map(m => `<tr><td>${memberLink(m)}${m.discord ? ' ' + discordBadge(m.discord) : ''}</td><td>${friendButton(m)}</td></tr>`).join('')}</table>`
                    : `<p class="dim small">${t('no_friends')}</p>`}
                ${outgoing.length ? `<p class="small dim" style="margin-top:10px">${t('request_sent')}</p>
                    <table>${outgoing.map(m => `<tr><td>${memberLink(m)}</td><td>${friendButton(m)}</td></tr>`).join('')}</table>` : ''}
            </div>
        </div>
        <div>
            <form class="panel" id="profileForm">
                <h2>${t('profile')}</h2>
                <label>${t('display_name')}<input name="name" maxlength="40" required value="${esc(me.name)}"></label>
                <label>${t('country')}<select name="country">${countryOptions(me.country)}</select></label>
                <div class="form-error"></div>
                <button class="btn">${t('save')}</button>
            </form>
            <form class="panel" id="discordForm">
                <h3>◆ ${t('discord_id')}</h3>
                <label>${verified ? t('discord_verified') : t('discord_manual')}
                    <input name="discord" maxlength="40" placeholder="username" value="${esc(me.discord?.handle)}"${verified ? ' disabled' : ''}></label>
                <p class="dim small">${t('discord_who')}</p>
                <label class="check"><input type="checkbox" name="everyone"${vis.everyone ? ' checked' : ''}><span>${t('vis_everyone')}</span></label>
                <label class="check"><input type="checkbox" name="friends"${vis.friends ? ' checked' : ''}><span>${t('vis_friends')}</span></label>
                <label class="check"><input type="checkbox" name="party"${vis.party ? ' checked' : ''}><span>${t('vis_party')}</span></label>
                <p class="dim small">${t('vis_hint')}</p>
                <div class="form-error"></div>
                <button class="btn">${t('save')}</button>
            </form>
            <div class="panel">
                <h3>${t('login_methods')}</h3>
                ${Object.keys(PROVIDERS).map(p => {
                    const linked = me.linked.includes(p);
                    return `<div class="row spread" style="padding:6px 0">
                        <span>${PROVIDERS[p].label} ${linked ? `<span class="tag passed">${t('linked')}</span>` : ''}</span>
                        ${linked ? `<button class="btn small ghost" data-action="unlink" data-id="${p}">${t('unlink')}</button>`
                            : enabled.includes(p) ? `<button class="btn small" data-action="oauth" data-id="${p}">${t('link')}</button>`
                            : `<span class="dim small">${t('not_configured')}</span>`}
                    </div>`;
                }).join('')}
                <form id="passwordForm" style="margin-top:12px">
                    <p class="dim small">${me.hasPassword ? t('change_password') : t('set_password')}</p>
                    ${me.hasPassword ? `<label>${t('current_password')}<input name="currentPassword" type="password" autocomplete="current-password" required></label>` : ''}
                    <label>${t('password')}<input name="password" type="password" autocomplete="new-password" required minlength="8"></label>
                    <div class="form-error"></div>
                    <button class="btn small">${t('save')}</button>
                </form>
            </div>
        </div>
    </div>`;
}

function viewMember() {
    const m = memberById(S.route[1]);
    if (!m) return `<p class="empty">404</p>`;
    const party = partyById(m.partyId);
    const proposed = S.data.agendas.filter(a => a.authorId === m.id);
    const isMe = S.me?.id === m.id;
    return `
    <div class="panel">
        <div class="row" style="align-items:flex-start;gap:18px">
            ${avatar(m, 96)}
            <div style="flex:1;min-width:0">
                <h2 style="margin:0">${esc(m.name)}</h2>
                <p class="dim">${flag(m.country)} ${esc(countryName(m.country) || '')}</p>
                ${party ? `<p>${partyLogo(party, 18) || `<span class="swatch" style="background:${party.color}"></span>`} <a href="#/party/${party.id}">${esc(party.name)}</a> · ${esc(roleName(party, m))}</p>`
                    : `<p class="dim">${t('independent')}</p>`}
                <p>${m.discord ? discordBadge(m.discord) : `<span class="dim small">◆ ${t('discord_hidden')}</span>`}</p>
                <div class="row">${isMe ? `<a class="btn small ghost" href="#/me">${t('edit_profile')}</a>` : friendButton(m)}</div>
            </div>
        </div>
    </div>
    <h3 class="section">${t('proposed_by_member')} <span class="dim small">${proposed.length}</span></h3>
    ${proposed.length ? proposed.map(agendaCard).join('') : `<p class="empty small">—</p>`}`;
}

// 이미지 고르기 → 정사각형 256px로 줄여 data URL (사진은 꽉 채워 자르고, 로고는 비율 유지)
function pickImage(fit = 'cover', size = 256) {
    return new Promise((resolve) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/png,image/jpeg,image/webp,image/gif';
        input.onchange = () => {
            const file = input.files[0];
            if (!file) return resolve(null);
            const img = new Image();
            img.onload = () => {
                const c = document.createElement('canvas');
                c.width = c.height = size;
                const ctx = c.getContext('2d');
                const { width: w, height: h } = img;
                if (fit === 'cover') {
                    const s = Math.min(w, h);
                    ctx.drawImage(img, (w - s) / 2, (h - s) / 2, s, s, 0, 0, size, size);
                } else {
                    const k = size / Math.max(w, h);
                    ctx.drawImage(img, (size - w * k) / 2, (size - h * k) / 2, w * k, h * k);
                }
                URL.revokeObjectURL(img.src);
                let url = c.toDataURL('image/webp', 0.85);
                if (!url.startsWith('data:image/webp')) url = c.toDataURL('image/png');
                resolve(url);
            };
            img.onerror = () => resolve(null);
            img.src = URL.createObjectURL(file);
        };
        input.click();
    });
}

function bindMeForms() {
    const bind = (id, fn) => {
        const form = document.getElementById(id);
        if (!form) return;
        form.onsubmit = async (e) => {
            e.preventDefault();
            const values = Object.fromEntries(new FormData(form));
            try { await fn(values, form); }
            catch (err) { $('.form-error', form).textContent = errText(err.message); }
        };
    };
    const done = async () => {
        document.activeElement?.blur();
        toast(t('saved'));
        await refresh();
    };
    bind('registerForm', async (v) => {
        const { token } = await api('POST', '/api/register', v);
        setToken(token);
        await refresh();
        location.hash = '#/chamber';
    });
    bind('loginForm', async (v) => {
        const { token } = await api('POST', '/api/login', v);
        setToken(token);
        await refresh();
        location.hash = '#/chamber';
    });
    bind('profileForm', async (v) => {
        await api('PATCH', '/api/me', v);
        await done();
    });
    bind('discordForm', async (v, form) => {
        const body = { discordVisibility: { everyone: !!v.everyone, friends: !!v.friends, party: !!v.party } };
        if (!form.discord.disabled) body.discord = v.discord || '';
        await api('PATCH', '/api/me', body);
        await done();
    });
    bind('passwordForm', async (v, form) => {
        await api('PATCH', '/api/me', v);
        form.reset();
        await done();
    });
}

// ===== 렌더 · 라우팅 =====
function render() {
    document.documentElement.lang = S.lang;
    document.querySelectorAll('[data-i18n]').forEach(el => { el.textContent = t(el.dataset.i18n); });
    $('#langBtn').textContent = t('lang');
    $('#tabMe').textContent = S.me ? `${flag(S.me.country)} ${S.me.name}` : t('tab_login');
    const tab = { agenda: 'agendas', party: 'parties' }[S.route[0]] || S.route[0];
    document.querySelectorAll('.tabs a').forEach(a => a.classList.toggle('active', a.dataset.tab === tab));
    if (!S.data) return;

    const view = $('#view');
    // 입력 중인 폼을 실시간 갱신으로 날리지 않도록, 같은 화면에서 입력칸에 초점이 있으면 다시 그리지 않음
    const key = `${S.route.join('/')}:${!!S.me}`;
    const focused = document.activeElement;
    if (view.dataset.view === key && view.contains(focused) && /^(INPUT|TEXTAREA|SELECT)$/.test(focused.tagName)) return;
    view.dataset.view = key;

    const views = { chamber: viewChamber, parties: viewParties, party: viewParty, agendas: viewAgendas, agenda: viewAgenda, me: viewMe, member: viewMember };
    view.innerHTML = (views[S.route[0]] || viewChamber)();

    const canvas = $('#chamber');
    if (canvas) {
        if (S.route[0] === 'agenda' && S.agenda) {
            mountHemicycle(canvas, agendaSeats(S.agenda), {
                voteOf: S.agenda.votes,
                centerTop: `${S.agenda.tally.yea} : ${S.agenda.tally.nay}`,
                centerBottom: `${t('yea')} : ${t('nay')}`,
            });
        } else {
            mountHemicycle(canvas, seatOrder(), { centerTop: String(S.data.members.length), centerBottom: t('SEATS') });
        }
    }
    if (S.route[0] === 'me') bindMeForms();
    if (S.route[0] === 'party') bindPartyForms();
}

async function onRoute() {
    S.route = (location.hash.replace(/^#\/?/, '') || 'chamber').split('/');
    // 소셜 로그인에서 돌아옴: #/auth/<token>, #/me/linked/<provider>, #/me/error/<code>
    if (S.route[0] === 'auth') {
        setToken(S.route[1]);
        history.replaceState(null, '', '#/me');
        S.route = ['me'];
        await refresh().catch(() => {});
    } else if (S.route[0] === 'me' && S.route[1]) {
        if (S.route[1] === 'linked') toast(t('linked'));
        if (S.route[1] === 'error') toast(errText(S.route[2]), true);
        history.replaceState(null, '', '#/me');
        S.route = ['me'];
    }
    if (S.route[0] === 'agenda') {
        S.agenda = null;
        S.agendaLoading = true;
        render();
        S.agenda = await api('GET', `/api/agendas/${S.route[1]}`).catch(() => null);
        S.agendaLoading = false;
    }
    $('#view').dataset.view = '';
    render();
    scrollTo(0, 0);
}

document.addEventListener('click', async (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const { action, id } = el.dataset;
    switch (action) {
        case 'close-dialog': $('#dialog').close(); break;
        case 'create-party': openPartyForm(null); break;
        case 'edit-party': openPartyForm(partyById(id)); break;
        case 'join': {
            const p = partyById(id);
            if (S.me.partyId && !confirm(t('confirm_switch', p.name))) return;
            act(() => api('POST', `/api/parties/${id}/join`), p.joinPolicy === 'approval' ? t('requested') : t('joined'));
            break;
        }
        case 'cancel-request': act(() => api('POST', `/api/parties/${id}/cancel-request`)); break;
        case 'kick':
            if (confirm(t('confirm_kick', memberById(id).name))) act(() => api('POST', `/api/parties/${S.route[1]}/members/${id}/kick`), t('saved'));
            break;
        case 'request':
            act(() => api('POST', `/api/parties/${S.route[1]}/requests/${id}/${el.dataset.decision}`), t('saved'));
            break;
        case 'add-role': openRoleForm(partyById(S.route[1]), null); break;
        case 'role-edit': {
            const p = partyById(S.route[1]);
            openRoleForm(p, p.roles.find(r => r.id === id));
            break;
        }
        case 'role-delete': {
            const p = partyById(S.route[1]);
            if (confirm(t('confirm_role_delete', p.roles.find(r => r.id === id).name))) act(() => api('DELETE', `/api/parties/${p.id}/roles/${id}`), t('saved'));
            break;
        }
        case 'role-move': act(() => api('POST', `/api/parties/${S.route[1]}/roles/${id}/move`, { dir: el.dataset.dir })); break;
        case 'edit-notice': openNoticeForm(partyById(S.route[1])); break;
        case 'leave':
            if (confirm(t('confirm_leave'))) act(() => api('POST', '/api/parties/leave'), t('left_party'));
            break;
        case 'new-agenda': openAgendaForm(); break;
        case 'support':
            act(() => api('POST', `/api/agendas/${id}/support`, { value: Number(el.dataset.value) }));
            break;
        case 'retract':
            e.preventDefault();
            act(() => api('POST', `/api/agendas/${S.agenda.id}/vote`, { choice: null }), t('retracted'));
            break;
        case 'befriend': act(() => api('POST', `/api/friends/${id}`), t('saved')); break;
        case 'unfriend': act(() => api('DELETE', `/api/friends/${id}`)); break;
        case 'oauth': {
            try {
                const { url } = await api('POST', `/api/oauth/${id}/start`);
                location.href = url;
            } catch (err) { toast(errText(err.message), true); }
            break;
        }
        case 'unlink': act(() => api('POST', `/api/oauth/${id}/unlink`), t('saved')); break;
        case 'avatar-upload': {
            const image = await pickImage('cover');
            if (image) act(() => api('POST', '/api/me/avatar', { image }), t('saved'));
            break;
        }
        case 'avatar-remove': act(() => api('POST', '/api/me/avatar', { image: null })); break;
        case 'logo-upload': {
            const image = await pickImage('contain');
            if (image) act(() => api('POST', `/api/parties/${S.route[1]}/logo`, { image }), t('saved'));
            break;
        }
        case 'logo-remove': act(() => api('POST', `/api/parties/${S.route[1]}/logo`, { image: null })); break;
        case 'dissolve': {
            const p = partyById(S.route[1]);
            if (prompt(t('confirm_dissolve', p.name)) !== p.name) return;
            await act(() => api('POST', `/api/parties/${p.id}/dissolve`), t('dissolved'));
            location.hash = '#/parties';
            break;
        }
        case 'vote':
            act(() => api('POST', `/api/agendas/${S.agenda.id}/vote`, { choice: el.dataset.choice }), t('voted'));
            break;
        case 'withdraw':
            if (confirm(t('confirm_withdraw'))) act(() => api('POST', `/api/agendas/${S.agenda.id}/withdraw`));
            break;
        case 'logout':
            await api('POST', '/api/logout').catch(() => {});
            setToken(null);
            location.hash = '#/chamber';
            refresh();
            break;
    }
});

// 선택 상자로 바로 반영되는 동작: 직책 임명, 입당 방식, 당론
document.addEventListener('change', (e) => {
    const el = e.target.closest('[data-change]');
    if (!el) return;
    const pid = S.route[1];
    switch (el.dataset.change) {
        case 'set-role': act(() => api('POST', `/api/parties/${pid}/members/${el.dataset.id}/role`, { roleId: el.value || null }), t('saved')); break;
        case 'join-policy': act(() => api('PATCH', `/api/parties/${pid}`, { joinPolicy: el.value }), t('saved')); break;
        case 'whip': act(() => api('POST', `/api/agendas/${S.agenda.id}/whip`, { choice: el.value }), t('saved')); break;
    }
});

$('#langBtn').onclick = () => {
    S.lang = S.lang === 'ko' ? 'en' : 'ko';
    safeSet('hn_lang', S.lang);
    $('#view').dataset.view = '';
    render();
};

addEventListener('hashchange', onRoute);

// 실시간 갱신: 누군가 입당·투표하면 서버가 알려 주고, 받으면 상태를 다시 불러옴
function connectStream() {
    if (!window.EventSource) { setInterval(scheduleRefresh, 10000); return; }
    const es = new EventSource('/api/stream');
    es.onmessage = scheduleRefresh;
}

// 남은 시간 표시를 1분마다 갱신
setInterval(() => { if (['agendas', 'agenda'].includes(S.route[0])) scheduleRefresh(); }, 60000);

(async () => {
    S.route = (location.hash.replace(/^#\/?/, '') || 'chamber').split('/');
    render();
    await document.fonts?.load('16px NeoDunggeunmo').catch(() => {});
    try { await refresh(); } catch (e) { toast(errText(e.message), true); }
    connectStream();
})();
