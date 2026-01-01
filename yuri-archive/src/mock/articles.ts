import type { Article } from '../types'
import { mockUsers } from './users'
import { mockTags } from './tags'

export const mockArticles: Article[] = [
  {
    id: 'article-1',
    title: '樱花树下的约定',
    summary: '高中最后一个春天，她们在樱花树下许下了永远在一起的约定。毕业后各奔东西，十年后的重逢，那个约定还算数吗？',
    content: `# 樱花树下的约定

春风轻拂，粉色的花瓣如雪般飘落。

"小雪，你说我们毕业后还能见面吗？"林晓站在樱花树下，仰望着满树繁花。

身旁的女孩沉默了一会儿，轻轻握住了她的手："会的，一定会的。"

## 十年后

东京的春天依旧美丽，但林晓已经很久没有认真看过樱花了。

作为一名忙碌的建筑设计师，她的生活被图纸和会议填满。直到那天，她在一个项目会议上，看到了那个熟悉的身影。

"林晓？"对方惊讶地叫出了她的名字。

是小雪。十年未见的小雪。

---

*"那个约定，你还记得吗？"*`,
    coverUrl: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?w=400',
    authorId: 'user-1',
    author: mockUsers[0],
    views: 1256,
    status: 'PUBLISHED',
    tags: [mockTags[0], mockTags[1], mockTags[6]],
    createdAt: '2024-06-01T10:00:00Z',
    updatedAt: '2024-06-01T10:00:00Z',
  },
  {
    id: 'article-2',
    title: '图书馆的秘密',
    summary: '每天放学后，她都会在图书馆的角落里看到那个安静看书的女孩。鼓起勇气搭话的那一天，她发现了一个意想不到的秘密。',
    content: `# 图书馆的秘密

图书馆的角落，总有一个女孩安静地坐在那里。

她叫苏晴，是隔壁班的学霸。而我，只是一个普通得不能再普通的学生。

每天放学后，我都会假装来图书馆自习，其实只是为了能多看她几眼。

## 那一天

"你每天都来这里，是在看什么书？"

我鼓起勇气走到她面前，心跳快得像要跳出胸口。

她抬起头，露出一个温柔的微笑："在等一个人。"

"等谁？"

"等一个每天都会来看我的人，鼓起勇气和我说话。"

---

原来，她一直都知道。`,
    coverUrl: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=400',
    authorId: 'user-2',
    author: mockUsers[1],
    views: 2341,
    status: 'PUBLISHED',
    tags: [mockTags[0], mockTags[2], mockTags[7]],
    createdAt: '2024-05-28T14:30:00Z',
    updatedAt: '2024-05-28T14:30:00Z',
  },
  {
    id: 'article-3',
    title: '咖啡店的常客',
    summary: '她是咖啡店的老板，每天都会为那位神秘的常客准备一杯特调。直到有一天，常客没有出现...',
    content: `# 咖啡店的常客

"老样子，一杯焦糖玛奇朵。"

每天下午三点，她都会准时出现。

我叫林薇，是这家小咖啡店的老板。而她，是我最特别的常客。

## 她的故事

她总是坐在靠窗的位置，打开笔记本电脑，一坐就是几个小时。

有时候她会皱眉，有时候她会微笑，有时候她会对着屏幕发呆。

我从不打扰她，只是默默地为她续杯，偶尔在杯子上画一个小小的爱心。

## 那一天

她没有来。

第二天也没有。

第三天，我在店门口看到了一封信：

*"谢谢你的咖啡，和那些小小的爱心。我要去追逐我的梦想了，但我会回来的。等我。"*`,
    authorId: 'user-3',
    author: mockUsers[2],
    views: 1876,
    status: 'PUBLISHED',
    tags: [mockTags[4], mockTags[1], mockTags[6]],
    createdAt: '2024-05-25T09:15:00Z',
    updatedAt: '2024-05-25T09:15:00Z',
  },
  {
    id: 'article-4',
    title: '同桌的你',
    summary: '高一开学第一天，她成了我的同桌。三年时光，从陌生到熟悉，从朋友到...更特别的存在。',
    content: `# 同桌的你

"你好，我叫陈念，以后请多关照。"

她笑起来的时候，眼睛弯成了月牙。

那是高一开学的第一天，她成了我的同桌。

## 三年

三年的时光，说长不长，说短不短。

我们一起上课，一起吃饭，一起回家。

她数学不好，我就每天给她讲题。

我英语不好，她就每天陪我背单词。

## 毕业那天

"我有话想对你说。"

毕业典礼结束后，她把我拉到了天台。

夕阳的余晖洒在她的脸上，美得不真实。

"我喜欢你，从高一第一天开始。"

原来，我们都在等对方先开口。`,
    coverUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=400',
    authorId: 'user-1',
    author: mockUsers[0],
    views: 3456,
    status: 'PUBLISHED',
    tags: [mockTags[0], mockTags[2], mockTags[7]],
    createdAt: '2024-05-20T16:00:00Z',
    updatedAt: '2024-05-20T16:00:00Z',
  },
  {
    id: 'article-5',
    title: '办公室恋情',
    summary: '作为新人，她没想到自己的直属上司竟然是大学时暗恋的学姐。职场与感情，她该如何抉择？',
    content: `# 办公室恋情

"欢迎加入我们团队，我是你的直属上司，周雨。"

我愣在原地，不敢相信自己的眼睛。

周雨，大学时期我暗恋了四年的学姐，现在竟然成了我的上司？

## 重逢

"学妹，好久不见。"

下班后，她约我去了公司附近的酒吧。

"你还记得我？"

"怎么会不记得，"她轻轻笑了，"每次社团活动都偷偷看我的小学妹。"

我的脸瞬间红了。

## 抉择

"公司有规定，上下级不能谈恋爱。"

"那就让我调到别的部门。"

"可是..."

"没有可是，"她握住我的手，"我等了你四年，不想再等了。"`,
    authorId: 'user-3',
    author: mockUsers[2],
    views: 2789,
    status: 'PUBLISHED',
    tags: [mockTags[3], mockTags[4], mockTags[2]],
    createdAt: '2024-05-15T11:30:00Z',
    updatedAt: '2024-05-15T11:30:00Z',
  },
]


// 继续添加更多文章以满足至少10篇的要求
export const mockArticles2: Article[] = [
  {
    id: 'article-6',
    title: '雨天的邂逅',
    summary: '没带伞的雨天，她在公交站遇到了一个愿意与她共撑一把伞的女孩。这场雨，改变了她的人生。',
    content: `# 雨天的邂逅

六月的雨，总是来得突然。

我站在公交站台下，看着倾盆大雨，懊恼自己没有带伞。

"要一起撑吗？"

一把淡紫色的伞出现在我头顶，伞的主人是一个笑容温暖的女孩。

## 缘分

"我叫林夏，你呢？"

"苏然。"

从那天起，每个雨天，她都会出现在公交站。

后来我才知道，她其实住在相反的方向。`,
    authorId: 'user-2',
    author: mockUsers[1],
    views: 1567,
    status: 'PUBLISHED',
    tags: [mockTags[4], mockTags[1], mockTags[6]],
    createdAt: '2024-05-10T08:45:00Z',
    updatedAt: '2024-05-10T08:45:00Z',
  },
  {
    id: 'article-7',
    title: '星空下的告白',
    summary: '天文社的两个女孩，在观测流星雨的夜晚，终于说出了藏在心底的话。',
    content: `# 星空下的告白

"快看，流星！"

我们躺在天文台的草地上，仰望着璀璨的星空。

"许愿了吗？"她问我。

"许了。"

"许了什么？"

"不能说，说了就不灵了。"

## 真相

其实我的愿望很简单。

我希望，能永远和她一起看星星。

"我也许愿了，"她突然说，"我希望你的愿望能实现。"

"你怎么知道我许了什么？"

"因为，"她转过头看着我，星光在她眼中闪烁，"我许的是一样的。"`,
    coverUrl: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400',
    authorId: 'user-1',
    author: mockUsers[0],
    views: 2134,
    status: 'PUBLISHED',
    tags: [mockTags[0], mockTags[2], mockTags[6]],
    createdAt: '2024-05-05T20:00:00Z',
    updatedAt: '2024-05-05T20:00:00Z',
  },
  {
    id: 'article-8',
    title: '魔法学院的秘密',
    summary: '在魔法学院里，她是天才魔法师，而我只是一个普通的见习生。但命运让我们相遇，一切都变得不同了。',
    content: `# 魔法学院的秘密

艾琳娜是学院里最耀眼的存在。

她的魔法天赋无人能及，她的美貌让所有人倾倒。

而我，只是一个连基础魔法都施展不好的见习生。

## 相遇

"你的魔法很特别。"

那天，她突然出现在我面前。

"我？我什么魔法都不会..."

"不，"她微笑着，"你拥有最珍贵的魔法——治愈之心。"

## 秘密

原来，天才魔法师也有软肋。

她的心，早已被黑暗侵蚀。

而我，是唯一能治愈她的人。`,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400',
    authorId: 'user-2',
    author: mockUsers[1],
    views: 1890,
    status: 'PUBLISHED',
    tags: [mockTags[5], mockTags[2]],
    createdAt: '2024-04-28T15:20:00Z',
    updatedAt: '2024-04-28T15:20:00Z',
  },
  {
    id: 'article-9',
    title: '邻居家的姐姐',
    summary: '从小，邻居家的姐姐就是我最崇拜的人。长大后，这份崇拜变成了别的东西...',
    content: `# 邻居家的姐姐

小时候，我最喜欢去隔壁找姐姐玩。

她会给我讲故事，教我画画，陪我看动画片。

在我心里，她就是世界上最温柔的人。

## 长大后

"小柔，你长大了呢。"

大学放假回家，她站在门口看着我，眼里满是惊喜。

"姐姐也是，越来越漂亮了。"

我的心跳得很快，和小时候不一样的快。

## 告白

"姐姐，我有话想对你说。"

"我知道，"她轻轻抱住我，"我等这句话，等了很久了。"`,
    authorId: 'user-3',
    author: mockUsers[2],
    views: 2567,
    status: 'PUBLISHED',
    tags: [mockTags[1], mockTags[2], mockTags[6]],
    createdAt: '2024-04-20T12:00:00Z',
    updatedAt: '2024-04-20T12:00:00Z',
  },
  {
    id: 'article-10',
    title: '乐队的夏天',
    summary: '她是主唱，我是吉他手。我们的乐队在那个夏天成立，我们的故事也在那个夏天开始。',
    content: `# 乐队的夏天

"我们组个乐队吧！"

那是高二的夏天，她站在音乐教室门口，眼睛亮晶晶的。

我看着她，鬼使神差地点了点头。

## 练习

每天放学后，我们都会在音乐教室练习。

她唱歌的时候，整个世界都安静了。

而我，只想永远为她伴奏。

## 那首歌

"这首歌，是我写给你的。"

演出结束后，她把歌词递给我。

我看着那些字句，泪水模糊了视线。

原来，她的每一首歌，都是在对我告白。`,
    coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
    authorId: 'user-1',
    author: mockUsers[0],
    views: 3210,
    status: 'PUBLISHED',
    tags: [mockTags[0], mockTags[2], mockTags[6]],
    createdAt: '2024-04-15T18:30:00Z',
    updatedAt: '2024-04-15T18:30:00Z',
  },
  {
    id: 'article-11',
    title: '深夜食堂的故事',
    summary: '她经营着一家只在深夜营业的小食堂，而我是每晚都会光顾的常客。食物治愈了我的胃，她治愈了我的心。',
    content: `# 深夜食堂的故事

凌晨两点，城市已经沉睡。

但在这条小巷的尽头，有一盏灯永远亮着。

"欢迎光临。"

她的声音温柔得像深夜的风。

## 常客

我是一个加班狂，每天都要工作到很晚。

偶然发现这家深夜食堂后，它就成了我的避风港。

"今天想吃什么？"

"老样子。"

她笑了笑，转身去厨房。

## 治愈

"你知道吗，"有一天她突然说，"我开这家店，就是为了等一个人。"

"等谁？"

"等一个需要被治愈的人。"她看着我，"现在，我找到了。"`,
    authorId: 'user-3',
    author: mockUsers[2],
    views: 1789,
    status: 'PUBLISHED',
    tags: [mockTags[4], mockTags[1]],
    createdAt: '2024-04-10T23:00:00Z',
    updatedAt: '2024-04-10T23:00:00Z',
  },
  {
    id: 'article-12',
    title: '画室的光',
    summary: '她是美术社的社长，我是误入画室的路人。当她说要画我的时候，我不知道，我已经走进了她的画里。',
    content: `# 画室的光

"你愿意做我的模特吗？"

我推开画室的门，本想找个安静的地方午睡，却遇到了她。

阳光从窗户洒进来，照在她身上，像一幅画。

## 画中人

每天午休，我都会来画室。

她画画，我看着她画画。

有时候她会让我摆各种姿势，有时候她只是安静地画着什么。

"你在画什么？"

"秘密。"

## 展览

美术社的展览上，我看到了那幅画。

画里是我，但不只是我。

画的名字叫《光》。

"因为你，就是照进我生命里的光。"`,
    coverUrl: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=400',
    authorId: 'user-2',
    author: mockUsers[1],
    views: 2456,
    status: 'PUBLISHED',
    tags: [mockTags[0], mockTags[1], mockTags[7]],
    createdAt: '2024-04-05T14:00:00Z',
    updatedAt: '2024-04-05T14:00:00Z',
  },
]

// 合并所有文章
export const allMockArticles: Article[] = [...mockArticles, ...mockArticles2]
