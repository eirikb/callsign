# Callsign

Proof of concept End-to-end encryption (E2EE)

----

* Create a domain, this will be your **callsign** for years to come
* Create a Let's Encrypt certificate
* Host this certificate on said domain

That's it.  
Share this domain with others, and they can use this to securely send you messages.  
No physical verification required.  
No manual verification required.

### Background

Intrigued by E2EE I did a deeper dive into how stuff work in the background in different apps.

I wondered how apps like WhatsApp, Signal and Telegram (providers) could possibly create a secure channel, through their
own servers, without being able to do MITM attacks themselves.  
I'm far from being a security expert, but I found this very interesting.  
I've found out that this is immensely difficult. What larger providers tend to do is use physical verification, in form
of emojis or QR code. People must meet in real life and physically exchange information.  
Video call could possibly be hacked with deep fakes.

This repo is a demo of an alternative solution.  
It is not anything new, it is just a version of similar solutions implemented in a neat package.

### How it came to be

Playing around with Microsoft Azure Web PubSub I wondered if I could send messages through their PubSub service
securely, without Microsoft snooping in.  
Looking at existing E2EE I looked at Key Exchange with Diffie-Hellman, but it became clear it was vulnerable against
MITM attacks.  
Discussing multiple solutions with other individuals lead me to decide shared public GPG keys would do fine.  
However, how to share them, and how to keep them up-to-date.  
Then I wondered if I could utilize Let's Encrypt certificates. They are great because:

* Signed by a CA
* Forced to refresh
* Lots of built-in support

So it came to be; why not simply host a Let's Encrypt certificate and sign a key from key exchange with the Let's
Encrypt key. Then users could verify the key using the certificate.

### Working demo

This whole idea is just a concept, but a working one.
