import { Link } from 'react-router-dom'
import { Brain, ArrowRight, Sparkles, Zap, PlayCircle, FileText } from '../components/icons/ExtraIcons.jsx'

export default function LandingPage() {
  return (
    <div className="landing">
      <section className="landing__hero">
        <div className="landing__hero-content">
          <div className="landing__pill">
            <Sparkles className="landing__pill-icon" />
            <span>AI-Powered Quiz Generator</span>
          </div>
          <h1 className="landing__title">
            Turn any document into an instant quiz
          </h1>
          <p className="landing__subtitle">
            Upload a PDF, DOCX, or text file and let AI generate a custom quiz for you. 
            Choose the number of questions and difficulty, then test your knowledge with a timer, 
            question palette, and detailed review.
          </p>
          <div className="landing__cta">
            <Link to="/register" className="btn btn--primary btn--lg">
              Get Started <ArrowRight />
            </Link>
            <Link to="/login" className="btn btn--secondary btn--lg">
              Sign In
            </Link>
          </div>
        </div>

        <div className="landing__features">
          <div className="feature-card">
            <div className="feature-card__icon"><FileText /></div>
            <h3>Document Upload</h3>
            <p>Upload PDF, DOCX, TXT, or MD files and generate quizzes from the content.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card__icon"><Zap /></div>
            <h3>AI Generation</h3>
            <p>AI creates multiple-choice questions with explanations directly from your document.</p>
          </div>
          <div className="feature-card">
            <div className="feature-card__icon"><PlayCircle /></div>
            <h3>Interactive Quiz</h3>
            <p>Timed questions, flagging, question palette, and detailed answer review.</p>
          </div>
        </div>
      </section>
    </div>
  )
}
