import {
  notificationHref,
  notificationIcon,
  notificationText,
  type NotificationLike,
} from '../notifications';

const story: NotificationLike = {
  kind: 'story',
  targetKind: 'story',
  targetId: 's1',
  preview: null,
};
const post: NotificationLike = { kind: 'post', targetKind: 'post', targetId: 'p1', preview: null };
const storyComment: NotificationLike = {
  kind: 'comment',
  targetKind: 'story',
  targetId: 's1',
  preview: '나도 가고싶다',
};
const postComment: NotificationLike = {
  kind: 'comment',
  targetKind: 'post',
  targetId: 'p1',
  preview: '이날 진짜 좋았어',
};

describe('notificationText', () => {
  it('이름은 성을 뗀다', () => {
    expect(notificationText(story, '정지수').title).toBe('지수');
  });

  it('이름이 없으면 상대로 부른다', () => {
    expect(notificationText(story, null).title).toBe('상대');
    expect(notificationText(story, '   ').title).toBe('상대');
  });

  it('kind별 문구', () => {
    expect(notificationText(story, '지수').body).toBe('스토리를 올렸어요');
    expect(notificationText(post, '지수').body).toBe('게시물을 올렸어요');
  });

  it('댓글은 어디에 달렸는지와 본문을 함께 보여준다', () => {
    expect(notificationText(storyComment, '지수').body).toBe('스토리 댓글: 나도 가고싶다');
    expect(notificationText(postComment, '지수').body).toBe('게시물 댓글: 이날 진짜 좋았어');
  });

  it('댓글 미리보기가 비면 본문 없이 말한다', () => {
    expect(notificationText({ ...postComment, preview: '   ' }, '지수').body).toBe(
      '게시물에 댓글을 남겼어요',
    );
    expect(notificationText({ ...storyComment, preview: null }, '지수').body).toBe(
      '스토리에 댓글을 남겼어요',
    );
  });
});

describe('notificationHref', () => {
  it('대상 종류로 경로가 갈린다 — 스토리 댓글이 게시물로 가면 안 된다', () => {
    expect(notificationHref(story)).toBe('/story/s1');
    expect(notificationHref(storyComment)).toBe('/story/s1');
    expect(notificationHref(post)).toBe('/feed/post/p1');
    expect(notificationHref(postComment)).toBe('/feed/post/p1');
  });
});

describe('notificationIcon', () => {
  it('댓글은 어디에 달렸든 같은 아이콘', () => {
    expect(notificationIcon(story)).toBe('image');
    expect(notificationIcon(post)).toBe('grid');
    expect(notificationIcon(storyComment)).toBe('comment');
    expect(notificationIcon(postComment)).toBe('comment');
  });
});
