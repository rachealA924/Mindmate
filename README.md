/////////////////////////
MINDMATE – MENTAL HEALTH SUPPORT APP

TABLE OF CONTENTS
1. Overview
2. Features
3. Demo
4. Technologies Used
5. API Integration
6. Local Development Setup
7. Deployment (Prerequisites, Web Server Configuration, Load Balancer Setup)
8. Challenges and Solutions
9. Credits and Acknowledgments

  1. OVERVIEW
MindMate is an interactive mental health support web application designed to help users assess their emotional state, schedule therapy sessions, and access motivational content.

By integrating multiple APIs, the app provides sentiment analysis of user inputs, motivational quotes, and a seamless appointment booking system using Google Calendar.

Important Disclaimer: This application is for educational purposes only and should not replace professional mental health services. Always seek qualified help for serious mental health concerns.

  2. FEATURES
    2.1 Mood & Sentiment Check Tool: Users type their feelings, and the app runs a sentiment analysis via Text Analysis API, Hugging Face API, and OpenAI for deeper insights.
    2.2 Appointment Booking System: Integrated with Google Calendar API to schedule sessions with therapists directly.
    2.3 Motivational Quotes API: Fetches daily motivational and wellness quotes for encouragement.
    2.4 Light/Dark Mode Toggle: Accessibility-friendly theme switcher.
    2.5 Responsive Design: Mobile-first design to ensure smooth access across devices.

  3. DEMO
A link to a demo video (demonstrating how to use application locally and how to access it online) : If it fails to play copy the link manually and run it in a new tab:
🎥 Demo Video Link: [https://www.canva.com/design/DAGvADjOAjg/hNuptDNknwl1qEHaSd2DvA/watch?utm_content=DAGvADjOAjg&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h5eb076e113]

🌐 Live Mindmate App via Load Balancer: [http://13.221.147.237/]

  4. TECHNOLOGIES USED
    4.1 Frontend:
      HTML (page structure)
      CSS (styling & animations)
      JavaScript (API calls, sentiment processing, booking logic)
    4.2 API Integrations:
      Zen Quotes API (Rapid API)
      Text Analysis API
      Hugging Face API (basic sentiment)
      Sentiment Analysis API (REST-based)
      OpenAI API (for conversational and emotional analysis)
      Google Calendar API (for therapist bookings)
    4.3 Deployment:
      NGINX on Web01 [http://54.173.195.177/] and Web02 [http://54.88.233.154/]
      NGINX Load Balancer (Lb01)

  5. API INTEGRATION
The application integrates multiple APIs to provide rich features:

✅ Text Analysis API – https://textanalysisapi.com/
Used for processing user text and extracting sentiment tone.

✅ Sentiment Analysis API – https://rapidapi.com/twinword/api/sentiment-analysis
Provides a REST endpoint for positive/neutral/negative sentiment detection.

✅ Hugging Face API – https://huggingface.co/inference-api
Offers deeper NLP analysis and contextual understanding.

✅ OpenAI API – https://platform.openai.com/docs/
Used for generating empathetic responses and natural language insights.

✅ Google Calendar API – https://developers.google.com/calendar
Enables booking and managing therapy sessions within the app.

✅ ZenQuotes API – https://zenquotes.io/
Supplies motivational quotes displayed in the app.

  6. LOCAL DEVELOPMENT SETUP
Follow these steps to run MindMate locally:

Step 1:
Clone the repo:
Mindmate by; git clone https://github.com/rachealA924/Mindmate.git

Step 2:
Open the project: You can simply open the index.html file in your browser as this is a purely front-end application


  7. DEPLOYMENT
    7.1 Prerequisites

Two web servers:
Web-01 and Web-02 (where nginx is installed, and I configured /etc/nginx/sites_available/default, this file is where I hosted my application for instance: I put all my files used to make application including; HTML, CSS, and JS, all were put inside this /var/www/html so that it can be accessed by visiting the IP_Address)
Load balancer: -Through lb-01 (where haproxy is installed to distribute the requests through those two servers. And those were done through configuring an haproxy config file ( /etc/haproxy/haproxy.cfg ), So you can access it through linking up to the IP_address of this lb-01)
    7.2 Domain name
A domain used, was created from DotTech domain where I was supposed to use it to link up with the IP_Address so if you vist my domain you will get the same by visiting via IP_Address but my application for the Domain was rejected in the meantime.
    7.3 SSL certificate
From lb-01 , I was supposed to create a certificate using certbot, issued by Letsencrypt and signed by it. So it isnt secure as it is because of the domain.

  8. CHALLENGES AND SOLUTIONS

🔴 Multiple API Rate Limits
Challenge: Free-tier APIs imposed strict call limits.
Solution: Implemented caching & fallback messages to reduce unnecessary API calls.

🔴 Google Calendar Authentication Issues
Challenge: OAuth setup required precise redirect URIs.
Solution: Configured correct authorized domains and tested with local + deployed servers.

🔴 Load Balancer Misrouting
Challenge: Initial config caused 502 Bad Gateway errors.
Solution: Fixed upstream IPs and reloaded NGINX successfully.

  9. CREDITS AND ACKNOWLEDGMENTS
APIs Used:
Text Analysis API – https://textanalysisapi.com/
Sentiment Analysis API – https://rapidapi.com/twinword/api/sentiment-analysis
Hugging Face API – https://huggingface.co/inference-api
OpenAI API – https://platform.openai.com/docs/
Google Calendar API – https://developers.google.com/calendar
ZenQuotes API – https://zenquotes.io/

Special thanks to:
API developers for free-tier access.
NGINX for handling deployment & load balancing.
Certbot/LetsEncrypt for SSL certificates.
