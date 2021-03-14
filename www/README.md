this directory is the code for a webserver that runs on the Pi.

to run it, use `nodejs index.js`. it will be accessible on port 3000 of the computer. to make it accessible on port 80, set up a redirect from port 80 to 3000 on the command line, and add it to your `/etc/rc.local` as well (before the `exit 0;`

```
iptables -t nat -A PREROUTING -i wlan0 -p tcp --dport 80 -j REDIRECT --to-port 3000
```


