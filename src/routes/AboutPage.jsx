import { Brain, Github, Linkedin, Mail, BookOpen, Zap, Sparkles, Target } from '../components/icons/ExtraIcons.jsx'

const team = [
  {
    name: 'Alex Chen',
    role: 'Frontend Lead',
    bio: 'React & UI architecture specialist. Loves clean state management.',
    icon: '🎨',
    links: { github: '#', linkedin: '#', email: '#' },
  },
  {
    name: 'Sam Rivera',
    role: 'Backend Engineer',
    bio: 'APIs and database design. Ensures data flows seamlessly end-to-end.',
    icon: '⚙️',
    links: { github: '#', linkedin: '#', email: '#' },
  },
  {
    name: 'Jordan Park',
    role: 'AI Integration',
    bio: 'LLM prompt engineering and document processing pipeline builder.',
    icon: '🤖',
    links: { github: '#', linkedin: '#', email: '#' },
  },
  {
    name: 'Taylor Kim',
    role: 'UX Designer',
    bio: 'Designs intuitive quiz interfaces with accessibility in mind.',
    icon: '✨',
    links: { github: '#', linkedin: '#', email: '#' },
  },
]

export default function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <Brain className="about-hero__icon" />
        <h1>About QuizMaster</h1>
        <p className="about-hero__desc">
          QuizMaster transforms any document into an interactive quiz using AI. Upload a PDF,
          choose your difficulty, and test your knowledge with a full quiz experience including
          timers, question palettes, and detailed reviews.
        </p>
      </section>

      <section className="about-features">
        <div className="about-feature">
          <FileText />
          <h3>Document Upload</h3>
          <p>Support for PDF, DOCX, TXT, and MD files up to 10 MB.</p>
        </div>
        <div className="about-feature">
          <Sparkles />
          <h3>AI Quiz Generation</h3>
          <p>AI reads your document and generates context-aware multiple-choice questions.</p>
        </div>
        <div className="about-feature">
          <Target />
          <h3>Interactive Quiz</h3>
          <p>Timer, question palette, flagging, auto-advance, and detailed answer review.</p>
        </div>
        <div className="about-feature">
          <Zap />
          <h3>Quick Quiz</h3>
          <p>Try trivia questions from the Open Trivia Database without any upload.</p>
        </div>
      </section>

      <section className="about-team">
        <h2 className="about-team__title">Meet the Team</h2>
        <div className="about-team__grid">
          {team.map((member) => (
            <div key={member.name} className="team-card">
              <div className="team-card__avatar">{member.icon}</div>
              <h3 className="team-card__name">{member.name}</h3>
              <span className="team-card__role">{member.role}</span>
              <p className="team-card__bio">{member.bio}</p>
              <div className="team-card__links">
                <a href={member.links.github} className="team-card__link" title="GitHub"><Github /></a>
                <a href={member.links.linkedin} className="team-card__link" title="LinkedIn"><Linkedin /></a>
                <a href={member.links.email} className="team-card__link" title="Email"><Mail /></a>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

function FileText() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ width: 28, height: 28 }}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  )
}
